/**
 *
 * (c) Copyright Ascensio System SIA 2020
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const version = '1.0.8';                                             // version of store (will change it when update something in store)
let start = Date.now();
const isLocal = ( (window.AscDesktopEditor !== undefined) && (window.location.protocol.indexOf('file') !== -1) ); // desktop detecting
let isPluginLoading = false;                                         // flag plugins loading
let isOnline = true;                                                 // flag internet connection
isLocal && checkInternet();                                          // check internet connection (only for desktop)
let interval = null;                                                 // interval for checking internet connection (if it doesn't work on launch)
const OOMarketplaceUrl = 'https://raw.githubusercontent.com/r7-consult/r7c-packages/main/';            // url to store (for local version store in desktop)
const OOIO = 'https://github.com/r7-consult/r7c-packages/';                       // url to github repository (for links and discussions)
const discussionsUrl = OOIO + 'discussions/';                        // discussions url
let searchTimeout = null;                                            // timeot for search
let founded = [];                                                    // last founded elemens (for not to redraw if a result is the same)
let catFiltred = [];                                                 // plugins are filtred by caterogy (used for search)
let updateCount = 0;                                                 // counter for plugins in updating process
let discussionCount = 0;                                             // counter for loading plugin`s discussions
let allPlugins = [];                                                 // list of all plugins from config
let installedPlugins = [];                                           // list of installed plugins (default to empty for standalone)
let hasAllPluginsData = false;                                       // flag when all plugin configs are loaded
const elements = {};                                                 // all elements
const guidMarkeplace = 'asc.{AA2EA9B6-9EC2-415F-9762-634EE8D9A95E}'; // guid marketplace
const guidSettings = 'asc.{8D67F3C5-7736-4BAE-A0F2-8C7127DC4BB8}';   // guid settings plugins
let editorVersion = null;                                            // edior current version
let loader;                                                          // loader
let themeType = detectThemeType();                                   // current theme
const lang = detectLanguage();                                       // current language
const shortLang = lang.split('-')[0];                                // short language
let bTranslate = false;                                              // flag translate or not
let isTranslationLoading = false;                                    // flag translation loading
let isFrameLoading = true;                                           // flag window loading
let translate = {'Loading': 'Loading'};                              // translations for current language (thouse will necessary if we don't get tranlation file)
let timeout = null;                                                  // delay for loader
let defaultBG = themeType == 'light' ? "#f7f7f7" : '#343434';        // default background color for plugin header
let isResizeOnStart = false;                                         // flag for firs resize on start
let slideIndex = 1;                                                  // index for slides
let PsMain = null;                                                   // scroll for list of plugins
let PsChangelog = null;                                               // scroll for changelog preview
const proxyUrl = 'https://plugins-services.onlyoffice.com/proxy';    // url to proxy for getting rating
const supportedScaleValues = [1, 1.25, 1.5, 1.75, 2];                // supported scale
let scale = {                                                        // current scale
	percent  : "100%",                                               // current scale in percent
	value    : 1,                                                    // current scale value
	devicePR : 1                                                     // device pixel ratio
};
calculateScale();
const themeOverrideKey = 'pm_theme_override';
const contentRemoteBases = [
	'https://raw.githubusercontent.com/r7-consult/r7c/main/',
	'https://raw.githubusercontent.com/r7-consult/r7c/master/'
];
const shouldLoadPluginLangs = false;
const contentLocalBase = '../';
let popupContentLoaded = false;
let popupWelcomeLoaded = false;
let popupLicenseLoaded = false;
let selectedLicenseLoaded = false;
let selectedPluginLicenseKey = '';
let selectedPluginLicenseSource = '';
let pendingRemoveAction = null;
const r7cFlyoutLastSeenDateKey = 'r7c_flyout_last_seen_date';
const fallbackWelcomeMarkdown = [
	'# Добро пожаловать в R7 Plugin Manager',
	'',
	'R7 Plugin Manager — менеджер установки и обновления плагинов для экосистемы R7.',
	'',
	'- Обновлённый интерфейс в стиле VS Code',
	'- Быстрый поиск и предпросмотр плагинов',
	'- Установка и обновление в одном окне',
	'- Встроенная вкладка License',
	'',
	'Telegram: [@SliderQuery](https://t.me/SliderQuery)',
	'GitHub Issues: [r7-consult/r7c-packages/issues](https://github.com/r7-consult/r7c-packages/issues)',
	'Сайт: [r7-consult.ru](https://r7-consult.ru/)'
].join('\n');
const fallbackLicenseMarkdown = [
	'# License',
	'',
	'Не удалось загрузить LICENSE.md удалённо.',
	'Показан fallback из встроенной версии плагина.'
].join('\n');

function normalizeThemeType(type) {
	return (type && type.includes('dark')) ? 'dark' : 'light';
}

function getThemeOverride() {
	try {
		return localStorage.getItem(themeOverrideKey);
	} catch (e) {
		return null;
	}
}

function setThemeOverride(type) {
	try {
		localStorage.setItem(themeOverrideKey, type);
	} catch (e) {
	}
}

function applyThemeClass() {
	if (!document.body)
		return;
	document.body.classList.toggle('theme-type-dark', themeType && themeType.includes('dark'));
}

function updateThemeToggleUI() {
	if (!elements.btnThemeLight || !elements.btnThemeDark)
		return;
	elements.btnThemeLight.classList.toggle('btn_toggle_active', !themeType.includes('dark'));
	elements.btnThemeDark.classList.toggle('btn_toggle_active', themeType.includes('dark'));
}

function refreshThemeDependentAssets() {
	defaultBG = themeType == 'light' ? "#f7f7f7" : '#343434';
	if (!elements.btnMarketplace)
		return;
	let bshowMarketplace = elements.btnMarketplace.classList.contains('btn_toolbar_active');
	let arrPl = bshowMarketplace ? allPlugins : installedPlugins;
	arrPl.forEach(function(pl) {
		let div = document.getElementById(pl.guid);
		if (div) {
			let variation = pl.variations ? pl.variations[0] : pl.obj.variations[0];
			let bg = defaultBG;
			if (variation.store) {
				if (variation.store.background)
					bg = variation.store.background[themeType]
			} else {
				div.firstChild.firstChild.setAttribute('src', getImageUrl(pl.guid, false, false, ('img_' + pl.guid)));
			}
			div.firstChild.setAttribute('style', ('background:' + bg));
		}
	});
	if (elements.imgIcon && elements.imgIcon.parentNode && elements.imgIcon.parentNode.parentNode && elements.imgIcon.parentNode.parentNode.parentNode) {
		let guid = elements.imgIcon.parentNode.parentNode.parentNode.getAttribute('data-guid');
		if (guid)
			elements.imgIcon.setAttribute('src', getImageUrl(guid, false, false, 'img_icon'));
	}
	updateThemeToggleUI();
}

function openExternalUrl(url) {
	if (!url)
		return;
	try {
		if (window.Asc && window.Asc.plugin && typeof window.Asc.plugin.executeMethod === 'function') {
			window.Asc.plugin.executeMethod('OpenLink', [url]);
			return;
		}
	} catch (e) {
	}
	try {
		window.open(url, '_blank', 'noopener');
	} catch (e) {
	}
}

function getLocalDateStamp() {
	let date = new Date();
	let yyyy = date.getFullYear();
	let mm = String(date.getMonth() + 1).padStart(2, '0');
	let dd = String(date.getDate()).padStart(2, '0');
	return yyyy + '-' + mm + '-' + dd;
}

function canShowR7cFlyoutToday() {
	try {
		let lastSeen = localStorage.getItem(r7cFlyoutLastSeenDateKey);
		return lastSeen !== getLocalDateStamp();
	} catch (e) {
		return true;
	}
}

function hideR7cFlyoutForToday() {
	if (elements.r7cFlyout)
		elements.r7cFlyout.classList.add('hidden');
	try {
		localStorage.setItem(r7cFlyoutLastSeenDateKey, getLocalDateStamp());
	} catch (e) {
	}
}

function setupR7cFlyout() {
	if (!elements.r7cFlyout)
		return;
	if (!canShowR7cFlyoutToday()) {
		elements.r7cFlyout.classList.add('hidden');
		return;
	}
	elements.r7cFlyout.classList.remove('hidden');

	const openTarget = function() {
		trackGoal('r7c_flyout_click');
		openExternalUrl('https://r7-consult.ru/?utm_source=r7c_store_flyout');
		hideR7cFlyoutForToday();
	};

	elements.r7cFlyout.addEventListener('click', openTarget);
	elements.r7cFlyout.addEventListener('keydown', function(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openTarget();
		}
	});
}

function isCommercialType(rawType) {
	let normalized = String(rawType || '').trim().toLowerCase();
	return normalized === 'commercial' || normalized === 'paid' || normalized === 'коммерческий';
}

function isCommercialPluginConfig(pluginConfig) {
	if (!pluginConfig)
		return false;
	let variation = (pluginConfig.variations && pluginConfig.variations[0]) ? pluginConfig.variations[0] : null;
	let store = variation && variation.store ? variation.store : null;
	if (store && Object.prototype.hasOwnProperty.call(store, 'commercial')) {
		let marker = store.commercial;
		if (marker === true)
			return true;
		if (typeof marker === 'string' && marker.trim()) {
			if (isCommercialType(marker))
				return true;
			if (isValidExternalUrl(marker))
				return true;
		}
		if (marker && typeof marker === 'object') {
			if (marker.enabled === true)
				return true;
			if (isValidExternalUrl(marker.url) || isValidExternalUrl(marker.link) || isValidExternalUrl(marker.landingUrl) || isValidExternalUrl(marker.website))
				return true;
		}
	}
	let typeValue = variation && variation.store && typeof variation.store.type === 'string'
		? variation.store.type
		: pluginConfig.type;
	return isCommercialType(typeValue);
}

function isValidExternalUrl(url) {
	if (!url || typeof url !== 'string')
		return false;
	try {
		let parsed = new URL(url, window.location.href);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch (e) {
		return false;
	}
}

function getCommercialLandingUrl(pluginConfig) {
	if (!pluginConfig)
		return '';
	let variation = (pluginConfig.variations && pluginConfig.variations[0]) ? pluginConfig.variations[0] : null;
	let store = variation && variation.store ? variation.store : null;
	let candidates = [];

	if (store) {
		if (typeof store.commercial === 'string') {
			candidates.push(store.commercial);
		} else if (store.commercial && typeof store.commercial === 'object') {
			candidates.push(store.commercial.url, store.commercial.link, store.commercial.landingUrl, store.commercial.website);
		}
		candidates.push(store.url, store.link, store.website, store.landingUrl);
	}

	candidates.push(pluginConfig.commercialUrl, pluginConfig.website, pluginConfig.homepage);

	for (let i = 0; i < candidates.length; i++) {
		if (isValidExternalUrl(candidates[i]))
			return candidates[i];
	}

	return '';
}

async function ensureCommercialAccess(pluginConfig) {
	let gate = window.TelegramCommercialGate;
	if (!isCommercialPluginConfig(pluginConfig))
		return { allowed: true, reason: 'not-commercial' };
	if (!gate || typeof gate.ensureAccess !== 'function')
		return { allowed: true, reason: 'gate-missing' };
	try {
		return await gate.ensureAccess(pluginConfig);
	} catch (e) {
		return { allowed: true, reason: 'gate-error' };
	}
}

function getSelectedPluginLicenseBase() {
	return selectedPluginLicenseSource || '';
}

async function fetchSelectedPluginLicense(baseUrl) {
	if (!baseUrl)
		return '';
	let normalizedBase = baseUrl.endsWith('/') ? baseUrl : (baseUrl + '/');
	try {
		normalizedBase = new URL(normalizedBase, location.href).href;
	} catch (e) {
	}
	let cacheBuster = 'v=' + Date.now();
	let candidates = ['LICENSE.md', 'LICENSE.MD', 'license.md', 'LICENSE', 'license'];
	for (let i = 0; i < candidates.length; i++) {
		let candidateUrl = normalizedBase + candidates[i] + '?' + cacheBuster;
		try {
			let response = await fetch(candidateUrl, { cache: 'no-cache' });
			if (!response.ok)
				continue;
			let text = await response.text();
			if (text && text.trim())
				return text;
		} catch (e) {
		}
	}
	return '';
}

function renderMarkdown(markdownText) {
	if (!markdownText)
		return '';
	try {
		let settings = getMarkedSetting();
		settings.headerIds = false;
		settings.headerPrefix = '';
		settings.mangle = false;
		if (window.marked && typeof window.marked.parse === 'function')
			return window.marked.parse(markdownText, settings);
		if (typeof window.marked === 'function')
			return window.marked(markdownText, settings);
	} catch (e) {
	}
	return markdownText.replace(/\n/g, '<br>');
}

function hideRemoveConfirm() {
	if (elements.removeConfirmOverlay)
		elements.removeConfirmOverlay.classList.add('hidden');
	pendingRemoveAction = null;
}

function requestRemoveConfirmation(pluginName, onConfirm) {
	if (!elements.removeConfirmOverlay || !elements.removeConfirmText) {
		if (window.confirm(getTranslated(messages.removeConfirmPrompt)))
			onConfirm();
		return;
	}
	pendingRemoveAction = onConfirm;
	let label = pluginName ? ('«' + pluginName + '»') : getTranslated('this plugin');
	elements.removeConfirmText.innerHTML = getTranslated(messages.removeConfirmPrompt) + ' ' + label;
	elements.removeConfirmOverlay.classList.remove('hidden');
}

async function fetchMarkdownWithFallback(fileName, fallbackMarkdown) {
	let cacheBuster = 'v=' + Date.now();
	for (let i = 0; i < contentRemoteBases.length; i++) {
		let remoteUrl = contentRemoteBases[i] + fileName + '?' + cacheBuster;
		try {
			let response = await fetch(remoteUrl, { cache: 'no-cache' });
			if (response.ok) {
				let text = await response.text();
				if (text && text.trim())
					return text;
			}
		} catch (e) {
		}
	}

	try {
		let localUrl = contentLocalBase + fileName + '?' + cacheBuster;
		let localResponse = await fetch(localUrl, { cache: 'no-cache' });
		if (localResponse.ok) {
			let localText = await localResponse.text();
			if (localText && localText.trim())
				return localText;
		}
	} catch (e) {
	}

	return fallbackMarkdown;
}

function isAbsolutePluginUrl(value) {
	return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function normalizePluginBaseUrl(value) {
	let url = String(value || '');
	if (url && url[url.length - 1] !== '/')
		url += '/';
	return url;
}

function buildPluginBaseCandidates(pluginName, baseUrl) {
	if (!pluginName)
		return [];
	if (isAbsolutePluginUrl(pluginName))
		return [normalizePluginBaseUrl(pluginName)];
	let cleanName = String(pluginName).replace(/^\/+/, '');
	let normalizedBase = normalizePluginBaseUrl(baseUrl);
	let candidates = [
		normalizedBase + 'sdkjs-plugins/content/' + cleanName + '/',
		normalizedBase + 'content/' + cleanName + '/',
		normalizedBase + cleanName + '/'
	];
	let unique = [];
	candidates.forEach(function(candidate) {
		if (unique.indexOf(candidate) === -1)
			unique.push(candidate);
	});
	return unique;
}

function loadPluginConfigByCandidates(candidates, onSuccess, onFail) {
	let lastUrl = '';
	(function tryLoad(index) {
		if (index >= candidates.length) {
			onFail(lastUrl);
			return;
		}
		let base = normalizePluginBaseUrl(candidates[index]);
		let confUrl = base + 'config.json';
		lastUrl = confUrl;
		makeRequest(confUrl, 'GET', null, null, true).then(
			function(response) {
				onSuccess(response, base, confUrl);
			},
			function() {
				tryLoad(index + 1);
			}
		);
	})(0);
}

async function fetchFirstMarkdown(candidates, fallbackMarkdown) {
	for (let i = 0; i < candidates.length; i++) {
		let value = await fetchMarkdownWithFallback(candidates[i], '');
		if (value && value.trim())
			return value;
	}
	return fallbackMarkdown;
}

function closeStorePluginWindow() {
	try {
		if (window.Asc && window.Asc.plugin && typeof window.Asc.plugin.executeCommand === 'function') {
			window.Asc.plugin.executeCommand('close', '');
			return;
		}
	} catch (e) {
	}
	try {
		window.close();
	} catch (e) {
	}
}

async function ensureStoreStartupAccess() {
	let gate = window.TelegramCommercialGate;
	if (!gate || typeof gate.ensureAccess !== 'function')
		return { allowed: true, reason: 'gate-missing' };
	try {
		// Принудительно запускаем gate для самого store-плагина при открытии.
		return await gate.ensureAccess({ type: 'commercial' });
	} catch (e) {
		return { allowed: true, reason: 'gate-error' };
	}
}

function switchWelcomeTab(tabName) {
	let isLicense = tabName === 'license';
	if (elements.welcomeTabWelcome)
		elements.welcomeTabWelcome.classList.toggle('welcome-tab-active', !isLicense);
	if (elements.welcomeTabLicense)
		elements.welcomeTabLicense.classList.toggle('welcome-tab-active', isLicense);
	if (elements.welcomeTabWelcome)
		elements.welcomeTabWelcome.setAttribute('aria-selected', isLicense ? 'false' : 'true');
	if (elements.welcomeTabLicense)
		elements.welcomeTabLicense.setAttribute('aria-selected', isLicense ? 'true' : 'false');
	if (elements.welcomeTabPanelWelcome)
		elements.welcomeTabPanelWelcome.classList.toggle('hidden', isLicense);
	if (elements.welcomeTabPanelLicense)
		elements.welcomeTabPanelLicense.classList.toggle('hidden', !isLicense);
	if (elements.welcomePopupModal)
		elements.welcomePopupModal.classList.toggle('welcome-popup-license-mode', isLicense);
	trackGoal('welcome_tab_switch', { tab: isLicense ? 'license' : 'welcome' });
}

async function loadPopupContent(tabName) {
	let targetTab = tabName === 'license' ? 'license' : 'welcome';
	if (targetTab === 'welcome') {
		if (popupWelcomeLoaded)
			return;
		let welcomeMarkdown = fallbackWelcomeMarkdown;
		try {
			welcomeMarkdown = await fetchFirstMarkdown(['welcome.md', 'WELCOME.md'], fallbackWelcomeMarkdown);
		} catch (e) {
		}
		if (elements.welcomeMarkdown)
			elements.welcomeMarkdown.innerHTML = renderMarkdown(welcomeMarkdown);
		popupWelcomeLoaded = true;
	} else {
		if (popupLicenseLoaded)
			return;
		let licenseMarkdown = fallbackLicenseMarkdown;
		try {
			licenseMarkdown = await fetchFirstMarkdown(['LICENSE.md', 'LICENSE.MD', 'license.md', 'LICENSE', 'license'], fallbackLicenseMarkdown);
		} catch (e) {
		}
		if (elements.licenseMarkdown)
			elements.licenseMarkdown.innerHTML = renderMarkdown(licenseMarkdown);
		popupLicenseLoaded = true;
	}

	popupContentLoaded = popupWelcomeLoaded && popupLicenseLoaded;
}

async function loadSelectedLicensePreview() {
	let sourceKey = getSelectedPluginLicenseBase();
	if (selectedLicenseLoaded && selectedPluginLicenseKey === sourceKey)
		return;
	if (!elements.divLicensePreview)
		return;
	elements.divLicensePreview.innerHTML = renderMarkdown('Загрузка лицензии плагина...');
	let licenseMarkdown = '';
	try {
		licenseMarkdown = await fetchSelectedPluginLicense(sourceKey);
	} catch (e) {
	}
	if (!licenseMarkdown.trim()) {
		licenseMarkdown = [
			'# License',
			'',
			'Для выбранного плагина LICENSE.md не найден.',
			'Проверьте, что в папке плагина есть файл LICENSE.md.'
		].join('\n');
	}
	elements.divLicensePreview.innerHTML = renderMarkdown(licenseMarkdown);
	selectedLicenseLoaded = true;
	selectedPluginLicenseKey = sourceKey;
}

function showWelcomePopup(tabName) {
	if (!elements.welcomePopupOverlay)
		return;
	let targetTab = tabName === 'license' ? 'license' : 'welcome';
	elements.welcomePopupOverlay.classList.remove('hidden');
	switchWelcomeTab(targetTab);
	loadPopupContent(targetTab);
	trackGoal('welcome_popup_open');
}

function hideWelcomePopup() {
	if (!elements.welcomePopupOverlay)
		return;
	elements.welcomePopupOverlay.classList.add('hidden');
	trackGoal('welcome_popup_close');
}

function bindPopupLinkHandling() {
	let onLinkClick = function(event) {
		let link = event.target.closest('a[href]');
		if (!link)
			return;
		let href = link.getAttribute('href');
		if (!href || href === '#')
			return;
		event.preventDefault();
		event.stopPropagation();
		openExternalUrl(href);
	};

	if (elements.welcomeMarkdown)
		elements.welcomeMarkdown.addEventListener('click', onLinkClick);
	if (elements.licenseMarkdown)
		elements.licenseMarkdown.addEventListener('click', onLinkClick);
	if (elements.divLicensePreview)
		elements.divLicensePreview.addEventListener('click', onLinkClick);
	if (elements.welcomeAside)
		elements.welcomeAside.addEventListener('click', onLinkClick);
}

function setThemeType(nextType, persist) {
	themeType = normalizeThemeType(nextType);
	if (window.Asc && window.Asc.plugin && window.Asc.plugin.theme)
		window.Asc.plugin.theme.type = themeType;
	applyThemeClass();
	if (document.body) {
		if (themeType.includes('light'))
			document.body.classList.add('white_bg');
		else
			document.body.classList.remove('white_bg');
	}
	refreshThemeDependentAssets();
	if (persist)
		setThemeOverride(themeType);
}
const languages = [                                                  // list of languages
	['cs-CZ', 'cs', 'Czech'],
	['de-DE', 'de', 'German'],
	['es-ES', 'es', 'Spanish'],
	['fr-FR', 'fr', 'French'],
	['it-IT', 'it', 'Italian'],
	['ja-JA', 'ja', 'Japanese'],
	['nl-NL', 'nl', 'Dutch'],
	['pt-PT', 'pt', 'Portuguese'],
	['pt-BR', 'pt', 'Brazilian'],
	['ru-RU', 'ru', 'Russian'],
	['si-SI', 'si', 'Sinhala'],
	['uk-UA', 'uk', 'Ukrainian'],
	['zh-ZH', 'zh', 'Chinese']
];
const messages = {
	versionWarning: 'This plugin will only work in a newer version of the editor.',
	linkManually: 'Install plugin manually',
	linkPR: 'Submit your own plugin',
	learnMore: 'Learn more',
	licensePlaceholder: 'Текст лицензии будет добавлен после получения от Марии.',
	removeConfirmPrompt: 'Are you sure you want to remove this plugin?',
	removeConfirmTitle: 'Remove plugin'
};
const isIE = (navigator.userAgent.toLowerCase().indexOf("msie") > -1 ||
				navigator.userAgent.toLowerCase().indexOf("trident") > -1 ||
				navigator.userAgent.toLowerCase().indexOf("edge") > -1);

// it's necessary because we show loader before all (and getting translations too)
switch (shortLang) {
	case 'ru':
		translate["Loading"] = "Загрузка"
		break;
	case 'fr':
		translate["Loading"] = "Chargement"
		break;
	case 'es':
		translate["Loading"] = "Carga"
		break;
	case 'de':
		translate["Loading"] = "Laden"
		break;
	case 'cs':
		translate["Loading"] = "Načítání"
		break;
	case 'it':
		translate["Loading"] = "Caricamento"
		break;
	case 'ja':
		translate["Loading"] = "積み込み"
		break;
	case 'pt':
		translate["Loading"] = "Carregamento"
		break;
	case 'si':
		translate["Loading"] = "පැටවීම"
		break;
	case 'uk':
		translate["Loading"] = "Вантаження"
		break;
	case 'zh':
		translate["Loading"] = "装载量"
		break;
}

// it's necessary for loader (because it detects theme by this object)
window.Asc = {
	plugin : {
		theme : {
			type :  themeType
		}
	}
};

const pos = location.href.indexOf('store/index.html'); // position for make substring
const ioUrl = location.href.substring(0, pos);         // real IO URL
const configUrl = (isLocal ? OOMarketplaceUrl : location.href.substring(0, pos)) + 'store/config.json';

// get translation file
getTranslation();
// fetch all plugins from config
fetchAllPlugins(true, false);

window.onload = async function() {
	let rule = '\n.asc-plugin-loader{background-color:' + (themeType == 'light' ? '#ffffff' : '#333333') + ';padding: 10px;display: flex;justify-content: center;align-items: center;border-radius: 5px;}\n'
	rule += '.asc-plugin-loader{color:' + (themeType == 'light' ? '#444444' : 'rgba(255,255,255,0.8)') + '}\n';
	let styleTheme = document.createElement('style');
	styleTheme.type = 'text/css';
	styleTheme.innerHTML = rule;
	document.getElementsByTagName('head')[0].appendChild(styleTheme);
	applyThemeClass();
	if (themeType.includes('light'))
		document.body.classList.add('white_bg');
	else
		document.body.classList.remove('white_bg');
	// init element
	initElemnts();
	try {
		if (window.Asc && window.Asc.plugin && typeof window.Asc.plugin.resizeWindow === 'function')
			window.Asc.plugin.resizeWindow(865, 600, 600, 600, 0, 0);
	} catch (e) {
	}
	let startupGateResult = await ensureStoreStartupAccess();
	if (startupGateResult && startupGateResult.allowed === false) {
		closeStorePluginWindow();
		return;
	}
	if (elements.btnSettings) {
		elements.btnSettings.onclick = function() {
			if (elements.settingsModal)
				elements.settingsModal.classList.remove('hidden');
			updateThemeToggleUI();
		};
	}
	if (elements.btnLicense) {
		elements.btnLicense.onclick = function() {
			trackGoal('license_click');
			showWelcomePopup('license');
		};
	}
	if (elements.btnReload) {
		elements.btnReload.onclick = function() {
			trackGoal('reload_click');
			toogleLoader(true, 'Loading');
			hasAllPluginsData = false;
			allPlugins = [];
			catFiltred = [];
			founded = [];
			fetchAllPlugins(true, false);
			sendMessage({type: 'getInstalled', updateInstalled: true}, '*');
		};
	}
	if (elements.btnSettingsClose) {
		elements.btnSettingsClose.onclick = function() {
			if (elements.settingsModal)
				elements.settingsModal.classList.add('hidden');
		};
	}
	if (elements.settingsModal) {
		elements.settingsModal.addEventListener('click', function(e) {
			if (e.target === elements.settingsModal)
				elements.settingsModal.classList.add('hidden');
		});
	}
	if (elements.btnThemeLight) {
		elements.btnThemeLight.onclick = function() {
			setThemeType('light', true);
		};
	}
	if (elements.btnThemeDark) {
		elements.btnThemeDark.onclick = function() {
			setThemeType('dark', true);
		};
	}
	if (elements.welcomePopupClose) {
		elements.welcomePopupClose.onclick = hideWelcomePopup;
	}
	if (elements.welcomePopupOk) {
		elements.welcomePopupOk.onclick = hideWelcomePopup;
	}
	if (elements.welcomeTabWelcome) {
		elements.welcomeTabWelcome.onclick = function() {
			switchWelcomeTab('welcome');
			loadPopupContent('welcome');
		};
	}
	if (elements.welcomeTabLicense) {
		elements.welcomeTabLicense.onclick = function() {
			switchWelcomeTab('license');
			loadPopupContent('license');
		};
	}
	if (elements.welcomePopupOverlay) {
		elements.welcomePopupOverlay.addEventListener('click', function(event) {
			if (event.target === elements.welcomePopupOverlay)
				hideWelcomePopup();
		});
	}
	if (elements.removeConfirmOverlay) {
		elements.removeConfirmOverlay.addEventListener('click', function(event) {
			if (event.target === elements.removeConfirmOverlay)
				hideRemoveConfirm();
		});
	}
	if (elements.btnRemoveConfirmCancel)
		elements.btnRemoveConfirmCancel.onclick = hideRemoveConfirm;
	if (elements.btnRemoveConfirmOk) {
		elements.btnRemoveConfirmOk.onclick = function() {
			let action = pendingRemoveAction;
			hideRemoveConfirm();
			if (typeof action === 'function')
				action();
		};
	}
	document.addEventListener('keydown', function(event) {
		if (event.key === 'Escape' && elements.welcomePopupOverlay && !elements.welcomePopupOverlay.classList.contains('hidden')) {
			hideWelcomePopup();
			return;
		}
		if (event.key === 'Escape' && elements.removeConfirmOverlay && !elements.removeConfirmOverlay.classList.contains('hidden'))
			hideRemoveConfirm();
	});
	bindPopupLinkHandling();
	setupR7cFlyout();
	showWelcomePopup('welcome');
	updateThemeToggleUI();
	trackGoal('app_open', {
		lang: lang,
		theme: themeType,
		local: isLocal ? '1' : '0'
	});
	isFrameLoading = false;
	onTranslate();

	if (shortLang == "en" || (!isPluginLoading && !isTranslationLoading)) {
		// if nothing to translate
		showMarketplace();
	}

	elements.btnAvailablePl.onclick = function(event) {
		// click on available plugins button
		toogleView(event.target, elements.btnMarketplace, messages.linkManually, false, false);
	};

	elements.btnMarketplace.onclick = function(event) {
		// click on marketplace button
		toogleView(event.target, elements.btnAvailablePl, messages.linkPR, true, false);
	};

	elements.inpSearch.addEventListener('input', function(event) {
		makeSearch(event.target.value.trim().toLowerCase());
	});
};

function ensurePluginChangelogLoaded(plugin) {
	if (!plugin || plugin.changelog || plugin._changelogLoading)
		return;
	plugin._changelogLoading = true;
	makeRequest(plugin.baseUrl + 'CHANGELOG.md', 'GET', null, null, false).then(
		function(response) {
			let settings = getMarkedSetting();
			let value = parseChangelog(response);
			let lexed = marked.lexer(value, settings);
			plugin.changelog = marked.parser(lexed, settings);
			plugin._changelogLoading = false;
			if (elements.divSelected && !elements.divSelected.classList.contains('hidden')) {
				let guid = elements.divSelected.getAttribute('data-guid');
				if (guid === plugin.guid) {
					document.getElementById('span_changelog').classList.remove('hidden');
					document.getElementById('div_changelog_preview').innerHTML = plugin.changelog;
					if (PsChangelog)
						PsChangelog.update();
				}
			}
		},
		function() {
			plugin._changelogLoading = false;
		}
	);
}

window.addEventListener('message', function(message) {
	// getting messages from editor or plugin

	// try to parse message
	try {
		message = JSON.parse(message.data);
	} catch (error) {
		// if we have a problem, don't process this message
		return;
	}

	let plugin;
	let installed;
	switch (message.type) {
		case 'InstalledPlugins':
			if (message.data) {
				// filter installed plugins (delete removed, that are in store and some system plugins)
				installedPlugins = message.data.filter(function(el) {
					return (el.guid !== guidMarkeplace && el.guid !== guidSettings && !( el.removed && el.obj.baseUrl.includes(ioUrl) ));
				});
				sortPlugins(false, true, 'start');
			} else {
				installedPlugins = [];
			}

			// console.log('getInstalledPlugins: ' + (Date.now() - start));

			if (message.updateInstalled) {
				showListofPlugins(false);
			} else if (!hasAllPluginsData && ( allPlugins.length || (isLocal && !isOnline) )) {
				getAllPluginsData(true, false);
			} else if (hasAllPluginsData && elements.btnMarketplace) {
				const bAll = elements.btnMarketplace.classList.contains('btn_toolbar_active');
				showListofPlugins(bAll);
			}
			
			break;
		case 'Installed':
			if (!message.guid) {
				// somethimes we can receive such message
				toogleLoader(false);
				return;
			}
			plugin = findPlugin(true, message.guid);
			installed = findPlugin(false, message.guid);
			if (!installed && plugin) {
				installedPlugins.push(
					{
						baseUrl: plugin.url,
						guid: message.guid,
						canRemoved: true,
						obj: plugin,
						removed: false
					}
				);
				// sortPlugins(false, true, 'name');
			} else if (installed) {
				if (installed.obj.backup) {
					// нужно обновить список установленных плагинов, чтобы ссылки на ресурсы были правильными
					sendMessage({ type: 'getInstalled', updateInstalled: true }, '*');
				}
				else
					installed.removed = false;
			}

			changeAfterInstallOrRemove(true, message.guid);
			trackGoal('plugin_install_success', {
				plugin_guid: message.guid,
				plugin_name: getPluginLabelByGuid(message.guid),
				source: isLocal ? 'desktop' : 'web'
			});
			toogleLoader(false);
			break;
		case 'Updated':
			updateCount--;
			if (!message.guid) {
				// somethimes we can receive such message
				if (!updateCount) {
					checkNoUpdated(true);
					toogleLoader(false);
				}
				return;
			}
			installed = findPlugin(false, message.guid);
			plugin = findPlugin(true, message.guid);

			installed.obj.version = plugin.version;
			plugin.bHasUpdate = false;

			if (!elements.divSelected.classList.contains('hidden')) {
				this.document.getElementById('btn_update').classList.add('hidden');
			}

			elements.spanVersion.innerText = plugin.version;
			let pluginDiv = this.document.getElementById(message.guid);
			if (pluginDiv)
				$(pluginDiv.lastChild.firstChild.lastChild).remove();

			if (!updateCount) {
				checkNoUpdated(true);
				toogleLoader(false);
			}
			break;
		case 'Removed':
			if (!message.guid) {
				// somethimes we can receive such message
				toogleLoader(false);
				return;
			}

			let bUpdate = false;
			let bHasLocal = false;
			let needBackup = message.backup;

			plugin = findPlugin(true, message.guid);
			installed = findPlugin(false, message.guid);
			
			if (installed) {
				bHasLocal = !installed.obj.baseUrl.includes(ioUrl);
				if (plugin && (!bHasLocal || (isLocal && !needBackup) ) ) {
					installedPlugins = installedPlugins.filter(function(el){return el.guid !== message.guid});
					bUpdate = true;
				} else {
					installed.removed = true;

					// нужно обновить список установленных плагинов, чтобы ссылки на ресурсы были правильными
					if (isLocal)
						sendMessage({ type: 'getInstalled', updateInstalled: true }, '*');
				}
			}

			if (elements.btnAvailablePl.classList.contains('btn_toolbar_active')) {
				if (bUpdate) {
					catFiltred = installedPlugins;
					let searchVal = elements.inpSearch.value.trim();
					if (searchVal !== '') {
						makeSearch(searchVal.toLowerCase());
					} else {
						let pluginDiv = this.document.getElementById(message.guid)
						$(pluginDiv).remove();
						PsMain.update();
					}
				} else {
					changeAfterInstallOrRemove(false, message.guid, bHasLocal);
				}
			} else {
				changeAfterInstallOrRemove(false, message.guid, bHasLocal);				
			}

			toogleLoader(false);
			break;
		case 'Error':
			createError(message.error);
			toogleLoader(false);
			break;
		case 'Theme':
			let override = getThemeOverride();
			if (override)
				themeType = normalizeThemeType(override);
			else if (message.theme.type)
				themeType = normalizeThemeType(message.theme.type);
			applyThemeClass();
			updateThemeToggleUI();

			let rule = '.text-secondary{color:'+message.theme["text-secondary"]+';}\n';
			rule += 'body{background: var(--pm-bg) !important; color: var(--pm-text) !important;}\n';

			if (themeType.includes('light')) {
				this.document.getElementsByTagName('body')[0].classList.add('white_bg');
			} else {
				this.document.getElementsByTagName('body')[0].classList.remove('white_bg');
			}

			let styleTheme = document.getElementById('theme_style');
			if (!styleTheme) {
				styleTheme = document.createElement('style');
				styleTheme.id = 'theme_style';
				styleTheme.type = 'text/css';
				document.getElementsByTagName('head')[0].appendChild(styleTheme);
			}
			refreshThemeDependentAssets();

			styleTheme.innerHTML = rule;
			break;
		case 'onExternalMouseUp':
			let evt = document.createEvent("MouseEvents");
			evt.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
			document.dispatchEvent(evt);
			break;
		case 'PluginReady':
			// get all installed plugins
			editorVersion = ( message.version && message.version.includes('.') ? getPluginVersion(message.version) : 1e8 );
			sendMessage({type: 'getInstalled'}, '*');
			break;
		case 'onClickBack':
			onClickBack();
			break;
	};
}, false);

function fetchAllPlugins(bFirstRender, bshowMarketplace) {
	// function for fetching all plugins from config
	isPluginLoading = true;
	makeRequest(configUrl, 'GET', null, null, true).then(
		function(response) {
			allPlugins = JSON.parse(response);
			if (installedPlugins)
				getAllPluginsData(bFirstRender, bshowMarketplace);
		},
		function(err) {
			createError( new Error('Problem with loading markeplace config.') );
			isPluginLoading = false;
			showMarketplace();
		}
	);
};

function makeRequest(url, method, responseType, body, bHandeNoInternet) {
	// this function makes GET request and return promise
	// maybe use fetch to in this function
	if (!method)
		method = 'GET';
	
	if (body)
		body = JSON.stringify(body);

	return new Promise(function (resolve, reject) {
		try {
			let xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			if (responseType)
				xhr.responseType = responseType;
			
			xhr.onload = function () {
				if (this.readyState == 4) {
					if (this.status !== 404 && (this.status == 200 || location.href.indexOf("file:") == 0)) {
						resolve(this.response);
					}
					if (this.status >= 400) {
						let errorText = this.status === 404 ? 'File not found.' : 'Network problem.';
						reject( new Error( getTranslated(errorText) ) );
					}
				}
			};

			xhr.onerror = function (err) {
				reject(err);
				if (url.includes('https') && bHandeNoInternet)
					handeNoInternet();
			};

			xhr.send(body);
		} catch (error) {
			reject(error);
		}
		
	});
};

function makeDesktopRequest(_url) {
	// function for getting rating page in desktop
	return new Promise(function(resolve, reject) {
		if ( !_url.startsWith('http') ) {
			resolve({status:'skipped', response: {statusText: _url}});
		} else {
			window.AscSimpleRequest.createRequest({
				url: _url,
				crossOrigin: true,
				crossDomain: true,
				timeout: 10000,
				headers: '',
				complete: function(e, status) {
					if ( status == 'success' ) {
						resolve({status:status, response:e});
					} else {
						reject({status:status, response:e});
					}
				},
				error: function(e, status, error) {
					reject({status:status, response:e});
				}
			});
		}
	});
};

function sendMessage(message) {
	// this function sends message to editor
	parent.postMessage(JSON.stringify(message), '*');
};

function detectLanguage() {
	// detect language or return default
	let lang = getUrlSearchValue("lang");
	if (lang.length == 2)
		lang = (lang.toLowerCase() + "-" + lang.toUpperCase());
	return lang || 'en-EN';
};

function detectThemeType() {
	// detect theme or return default
	let override = getThemeOverride();
	if (override)
		return normalizeThemeType(override);
	let type = getUrlSearchValue("theme-type");
	return normalizeThemeType(type || 'dark');
};

function initElemnts() {
	elements.btnAvailablePl = document.getElementById('btn_AvailablePlugins');
	elements.btnMarketplace = document.getElementById('btn_marketplace');
	elements.linkNewPlugin = document.getElementById('link_newPlugin');
	elements.divBody = document.getElementById('div_body');
	elements.divMain = document.getElementById('div_main');
	// elements.arrow = document.getElementById('arrow');
	// elements.close = document.getElementById('close');
	elements.divHeader = document.getElementById('div_header');
	elements.btnSettings = document.getElementById('btn_settings');
	elements.btnReload = document.getElementById('btn_reload');
	elements.btnLicense = document.getElementById('btn_license');
	elements.settingsModal = document.getElementById('settings_modal');
	elements.btnSettingsClose = document.getElementById('btn_settings_close');
	elements.btnThemeLight = document.getElementById('btn_theme_light');
	elements.btnThemeDark = document.getElementById('btn_theme_dark');
	elements.removeConfirmOverlay = document.getElementById('remove_confirm_overlay');
	elements.removeConfirmTitle = document.getElementById('remove_confirm_title');
	elements.removeConfirmText = document.getElementById('remove_confirm_text');
	elements.btnRemoveConfirmCancel = document.getElementById('btn_remove_confirm_cancel');
	elements.btnRemoveConfirmOk = document.getElementById('btn_remove_confirm_ok');
	elements.r7cFlyout = document.getElementById('r7c-flyout');
	elements.r7cFlyoutLogo = document.getElementById('r7c-flyout-logo');
	elements.welcomePopupOverlay = document.getElementById('welcome-popup-overlay');
	elements.welcomePopupModal = document.querySelector('#welcome-popup-overlay .welcome-popup-modal');
	elements.welcomePopupClose = document.getElementById('welcome-popup-close');
	elements.welcomePopupOk = document.getElementById('welcome-ok');
	elements.welcomeTabWelcome = document.getElementById('welcome-tab-welcome');
	elements.welcomeTabLicense = document.getElementById('welcome-tab-license');
	elements.welcomeTabPanelWelcome = document.getElementById('welcome-tab-panel-welcome');
	elements.welcomeTabPanelLicense = document.getElementById('welcome-tab-panel-license');
	elements.welcomeMarkdown = document.getElementById('welcome-markdown');
	elements.licenseMarkdown = document.getElementById('license-markdown');
	elements.divSelectedLicense = document.getElementById('div_selected_license');
	elements.divLicensePreview = document.getElementById('div_license_preview');
	elements.spanLicense = document.getElementById('span_license');
	elements.welcomeAside = document.getElementById('welcome-aside');
	elements.settingsTitle = document.getElementById('settings_title');
	elements.divSelected = document.getElementById('div_selected_toolbar');
	elements.divSelectedMain = document.getElementById('div_selected_main');
	elements.imgIcon = document.getElementById('img_icon');
	elements.spanName = document.getElementById('span_name');
	elements.spanOffered = document.getElementById('span_offered');
	elements.btnUpdate = document.getElementById('btn_update');
	elements.btnRemove = document.getElementById('btn_remove');
	elements.btnInstall = document.getElementById('btn_install');
	elements.btnLearnMore = document.getElementById('btn_learn_more');
	elements.spanSelectedDescr = document.getElementById('span_selected_description');
	elements.linkPlugin = document.getElementById('link_plugin');
	elements.divScreen = document.getElementById("div_selected_image");
	elements.divGitLink = document.getElementById('div_github_link');
	elements.spanVersion = document.getElementById('span_ver');
	elements.divVersion = document.getElementById('div_version');
	elements.spanMinVersion = document.getElementById('span_min_ver');
	elements.divMinVersion = document.getElementById('div_min_version');
	elements.spanLanguages = document.getElementById('span_langs');
	elements.divLanguages = document.getElementById('div_languages');
	elements.inpSearch = document.getElementById('inp_search');
	elements.btnUpdateAll = document.getElementById('btn_updateAll');
	elements.divRatingLink = document.getElementById('div_rating_link');
	elements.discussionLink = document.getElementById('discussion_link');
	elements.ratingStars = document.getElementById('div_rating_stars');
	elements.totalVotes = document.getElementById('total_votes');
	elements.divVotes = document.getElementById('div_votes');
	elements.arrowPrev = document.getElementById('prev_arrow');
	elements.arrowNext = document.getElementById('next_arrow');
	elements.divReadme = document.getElementById('div_readme_link');
	elements.linkReadme = document.getElementById('link_readme');
};

function toogleLoader(show, text) {
	// show or hide loader (don't use elements for this function)
	if (!show) {
		clearTimeout(timeout);
		document.getElementById('loader-container').classList.add('hidden');
		loader && (loader.remove ? loader.remove() : $('#loader-container')[0].removeChild(loader));
		loader = undefined;	
	} else if(!loader) {
		document.getElementById('loader-container').classList.remove('hidden');
		loader && (loader.remove ? loader.remove() : $('#loader-container')[0].removeChild(loader));
		loader = showLoader($('#loader-container')[0], ( getTranslated(text) ) + '...');
	}
};

function getAllPluginsData(bFirstRender, bshowMarketplace) {
	// get config file for each item in config.json
	isPluginLoading = true;
	let count = 0;
	let Unloaded = [];
	let url = isLocal ? OOMarketplaceUrl : ioUrl;
	allPlugins.forEach(function(plugin, i, arr) {
		count++;
		if (typeof plugin !== 'object') {
			plugin.name = plugin;
		}
		let pluginCandidates = buildPluginBaseCandidates(plugin.name, url);
		loadPluginConfigByCandidates(
			pluginCandidates,
			function(response, pluginUrl, confUrl) {
				let config = JSON.parse(response);
				config.url = pluginUrl;
				config.configUrl = confUrl;
				config.baseUrl = pluginUrl;
				arr[i] = config;
				config.languages = [ getTranslated('English') ];
				if (shouldLoadPluginLangs) {
					makeRequest(pluginUrl + 'translations/langs.json', 'GET', null, null, false).then(
						function(response) {
							let supportedLangs = [ getTranslated('English') ];
							let arr = JSON.parse(response);
							arr.forEach(function(full) {
								let short = full.split('-')[0];
								for (let i = 0; i < languages.length; i++) {
									// detect only full language (because we can make mistake with some langs. for instance: "pt-PT" and "pt-BR")
									if (languages[i][0] == full /*|| languages[i][1] == short*/) {
										supportedLangs.push( getTranslated( languages[i][2] ) );
									}
								}
							});
							if (supportedLangs.length > 1)
								config.languages = supportedLangs;
						},
						function(error) {
							config.languages = [ getTranslated('English') ];
						}
					);
				}
				if (plugin.discussion) {
					discussionCount++;
					config.discussionUrl = discussionsUrl + plugin.discussion;
					getDiscussion(config);
				}
				count--;
				if (!count)
					endPluginsDataLoading(bFirstRender, bshowMarketplace, Unloaded);
			},
			function(confUrl) {
				count--;
				Unloaded.push(i);
				console.warn('Problem with loading plugin config:', confUrl);
				if (!count)
					endPluginsDataLoading(bFirstRender, bshowMarketplace, Unloaded);
			}
		);
	});

	if (isLocal && installedPlugins && bFirstRender && !isOnline) {
		isPluginLoading = false;
		getInstalledLanguages();
		showMarketplace();
	}
};

function getDiscussion(config) {
	// get discussion page
	if (isLocal && window.AscSimpleRequest && window.AscSimpleRequest.createRequest) {
		makeDesktopRequest(config.discussionUrl).then(
			function(data) {
				if (data.status == 'success') {
					config.rating = parseRatingPage(data.response.responseText);
				}
				discussionCount--;
				if (!discussionCount)
					showRating();
			},
			function(err) {
				createError(err.response, false);
				discussionCount--;
				if (!discussionCount)
					showRating();
			}
		);
	} else {
		let body = { target: config.discussionUrl };
		makeRequest(proxyUrl, 'POST', null, body, false).then(function(data) {
			data = JSON.parse(data);
			config.rating = parseRatingPage(data);
			discussionCount--;
			if (!discussionCount)
				showRating();
		}, function(err) {
			createError( new Error('Problem with loading rating'), true);
			discussionCount--;
			if (!discussionCount)
				showRating();
		});
	}
};

function endPluginsDataLoading(bFirstRender, bshowMarketplace, Unloaded) {
	// console.log('getAllPluginsData: ' + (Date.now() - start));
	removeUnloaded(Unloaded);
	sortPlugins(true, false, 'name');
	hasAllPluginsData = true;
	isPluginLoading = false;
	if (bFirstRender)
		showMarketplace();
	else if (bshowMarketplace)
		toogleView(elements.btnMarketplace, elements.btnAvailablePl, messages.linkPR, true, true);
};

function getInstalledLanguages() {
	installedPlugins.forEach(function(pl) {
		pl.obj.languages = [ getTranslated('English') ];
		if (!shouldLoadPluginLangs)
			return;
		makeRequest(pl.obj.baseUrl + 'translations/langs.json', 'GET', null, null, false).then(
			function(response) {
				let supportedLangs = [ getTranslated('English') ];
				let arr = JSON.parse(response);
				arr.forEach(function(full) {
					let short = full.split('-')[0];
					for (let i = 0; i < languages.length; i++) {
						if (languages[i][0] == short || languages[i][1] == short) {
							supportedLangs.push( getTranslated( languages[i][2] ) );
						}
					}
				});
				if (supportedLangs.length > 1)
					pl.obj.languages = supportedLangs;
			},
			function(error) {
				pl.obj.languages = [ getTranslated('English') ];
			}
		)
	});
};

function showListofPlugins(bAll, sortedArr) {
	// show list of plugins
	$('.div_notification').remove();
	$('.div_item').remove();
	let arr = (sortedArr ? sortedArr : (bAll ? allPlugins : installedPlugins));

	if (arr.length) {
		arr.forEach(function(plugin) {
			if (plugin && plugin.guid)
				createPluginDiv(plugin, !bAll);
		});
		setTimeout(function(){if (PsMain) PsMain.update(); toogleLoader(false);});
	} else {
		// if no istalled plugins and available plugins button was clicked
		let notification = Array.isArray(sortedArr) ? 'Nothing was found for this query.' : bAll ? 'Problem with loading plugins.' : 'No installed plugins.';
		createNotification(notification);
		toogleLoader(false);
	}
	// scroll for list of plugins
	if (!PsMain) {
		PsMain = new PerfectScrollbar('#div_main', {});
		PsMain.update();
	} else {
		PsMain.update();
	}
	// scroll for changelog preview
	if (!PsChangelog) {
		PsChangelog = new PerfectScrollbar('#div_selected_changelog', {});
		PsChangelog.update();
	}
};

function getPluginVersion(text) {
	let factor = 1000;
	let major = 1;
	let minor = 0;
	let build = 0;

	if (text && text.split) {
		let arValues = text.split('.');
		let count = arValues.length;
		if (count > 0) major = parseInt(arValues[0]);
		if (count > 1) minor = parseInt(arValues[1]);
		if (count > 2) build = parseInt(arValues[2]);
	}

	return major * factor * factor + minor * factor + build;
};

function getPluginTypeLabel(plugin, variation) {
	let rawType = '';
	if (variation && variation.store && typeof variation.store.type === 'string')
		rawType = variation.store.type;
	else if (plugin && typeof plugin.type === 'string')
		rawType = plugin.type;

	let normalized = String(rawType || '').trim().toLowerCase();
	if (!normalized)
		return '';
	if (isCommercialType(normalized))
		return getTranslated('Commercial');
	return rawType;
}

function createPluginDiv(plugin, bInstalled) {
	// this function creates div (preview) for plugins
	let div = document.createElement('div');
	div.id = plugin.guid;
	div.setAttribute('data-guid', plugin.guid);
	div.className = 'div_item noselect';
	div.onmouseenter = function(event) {
		event.target.classList.add('div_item_hovered');
	};

	div.onmouseleave = function(event) {
		event.target.classList.remove('div_item_hovered');
	};

	div.onclick = onClickItem;

	let installed = bInstalled ? plugin : findPlugin(false, plugin.guid);
	if (bInstalled) {
		plugin = findPlugin(true, plugin.guid);
	}

	let bCheckUpdate = true;
	if (!plugin) {
		plugin = installed.obj;
		bCheckUpdate = false;
	}

	let bNotAvailable = false;
	const minV = (plugin.minVersion ? getPluginVersion(plugin.minVersion) : -1);
	if (minV > editorVersion) {
		bCheckUpdate = false;
		bNotAvailable = true;
	}

	let bHasUpdate = false;
	let bRemoved = (installed && installed.removed);
	if (bCheckUpdate && installed && plugin) {
		const installedV = getPluginVersion(installed.obj.version);
		const lastV = getPluginVersion(plugin.version);
		if (lastV > installedV) {
			bHasUpdate = true;
			plugin.bHasUpdate = true;
			if (!bRemoved)
				elements.btnUpdateAll.classList.remove('hidden');
		}
	}
	
	let variation = plugin.variations[0];
	let name = ( bTranslate && plugin.nameLocale && ( plugin.nameLocale[lang] || plugin.nameLocale[shortLang] ) ) ? ( plugin.nameLocale[lang] || plugin.nameLocale[shortLang] ) : plugin.name;
	let description = ( bTranslate && variation.descriptionLocale && ( variation.descriptionLocale[lang] || variation.descriptionLocale[shortLang] ) ) ? ( variation.descriptionLocale[lang] || variation.descriptionLocale[shortLang] ) : variation.description;
	let bg = variation.store && variation.store.background ? variation.store.background[themeType] : defaultBG;
	let additional = bNotAvailable ? 'disabled title="' + getTranslated(messages.versionWarning) + '"'  : '';
	let versionLabel = plugin.version ? ('v' + plugin.version) : '';
	let typeLabel = getPluginTypeLabel(plugin, variation);
	let isCommercial = isCommercialPluginConfig(plugin);
	let isInstalled = (installed && !bRemoved);
	let statusText = isCommercial ? getTranslated('Commercial') : getTranslated(isInstalled ? 'Installed' : 'Not installed');
	let statusClass = 'card_status' + (isInstalled ? ' status_installed' : '') + (isCommercial ? ' status_commercial' : '');
	let actionHtml = '';
	if (isCommercial) {
		actionHtml = '<button class="btn_item btn-text-default btn_install btn_learn_more" onclick="onClickLearnMore(event.target, event)">' + getTranslated(messages.learnMore) + '</button>';
	} else {
		actionHtml = isInstalled
			? (installed.canRemoved
				? '<button class="btn-text-default btn_item btn_remove" onclick="onClickRemove(event.target, event)" ' + (bNotAvailable ? "dataDisabled=\"disabled\"" : "") +'>' + getTranslated("Remove") + '</button>'
				: '<div class="card_spacer"></div>')
			: '<button class="btn_item btn-text-default btn_install" onclick="onClickInstall(event.target, event)"' + additional + '>'  + getTranslated("Install") + '</button>';
	}

	let template = '<div class="div_image" style="background: ' + bg + '">' +
						'<img id="img_'+plugin.guid+'" class="plugin_icon" style="display:none" data-guid="' + plugin.guid + '" src="' + getImageUrl(plugin.guid, false, true, ('img_' + plugin.guid) ) + '">' +
					'</div>' +
					'<div class="div_description">' +
						'<div class="card_title">' +
							'<span class="span_name">' + name + '</span>' +
							(typeLabel ? '<span class="span_plugin_type" title="' + typeLabel + '">' + typeLabel + '</span>' : '') +
							(versionLabel ? '<span class="span_version">' + versionLabel + '</span>' : '') +
						'</div>' +
						'<span class="span_description">' + description + '</span>' +
					'</div>' +
					'<div class="div_footer">' +
						'<span class="' + statusClass + '">' + statusText + '</span>' +
						actionHtml +
					'</div>';
	div.innerHTML = template;
	elements.divMain.appendChild(div);
	if (PsMain) PsMain.update();
};

function showRating() {
	// console.log('showRating: ' + (Date.now() - start));
	allPlugins.forEach(function(plugin) {
		let div = document.getElementById(plugin.guid);
		if (plugin.rating && div) {
			let ratingCard = div.querySelector('.div_rating_card');
			if (!ratingCard)
				return;
			let stars = ratingCard.querySelector('.div_rating');
			let total = ratingCard.querySelector('span');
			if (stars && stars.lastElementChild)
				stars.lastElementChild.style.width = plugin.rating.percent;
			if (total)
				total.innerText = plugin.rating.total;
			ratingCard.classList.remove('hidden');
		}
	});

	if (elements.divSelected && !elements.divSelected.classList.contains('hidden')) {
		let guid = elements.divSelected.getAttribute('data-guid');
		let plugin = findPlugin(true, guid);
		if (plugin) {
			elements.totalVotes.innerText = plugin.rating.total;
			document.getElementById('stars_colored').style.width = plugin.rating.percent;
			// elements.divRatingLink.classList.remove('hidden');
			elements.divRatingLink.removeAttribute('title');
			elements.divVotes.classList.remove('hidden');
			elements.discussionLink.classList.remove('hidden');
		} else {
			elements.divRatingLink.setAttribute('title', getTranslated('No disscussion page for this plugin.'));
		}
	}
};

async function onClickInstall(target, event) {
	// click install button
	event.stopImmediatePropagation();
	let guid = target.parentNode.parentNode.getAttribute('data-guid');
	let plugin = findPlugin(true, guid);
	let installed = findPlugin(false, guid);
	let sourcePlugin = plugin || (installed ? installed.obj : null);
	if (isCommercialPluginConfig(sourcePlugin)) {
		onClickLearnMore(target, event);
		return;
	}
	// click install button
	// we should do that because we have some problem when desktop is loading plugin
	if (isLocal) {
		toogleLoader(true, 'Installation');
	} else {
		clearTimeout(timeout);
		timeout = setTimeout(toogleLoader, 200, true, "Installation");
	}
	if (!plugin && !installed) {
		// if we are here if means that plugin tab is opened, plugin is uninstalled and we don't have internet connection
		sendMessage( { type : "showButton", show : false } );
		onClickBack();
		toogleLoader(false);
		return;
	}
	let message = {
		type : 'install',
		url : (installed ? installed.obj.baseUrl : plugin.url),
		guid : guid,
		config : (installed ? installed.obj : plugin)
	};
	let gateResult = await ensureCommercialAccess(message.config);
	if (gateResult && gateResult.allowed === false) {
		toogleLoader(false);
		return;
	}
	trackGoal('plugin_install_click', {
		plugin_guid: guid,
		plugin_name: getPluginLabelByGuid(guid),
		source: isLocal ? 'desktop' : 'web'
	});
	// we should do that because we have some problem when desktop is loading plugin
	if (isLocal) {
		setTimeout(function() {
			sendMessage(message);
		}, 200);
	} else {
		sendMessage(message);
	}
};

async function onClickUpdate(target) {
	// click update button
	let guid = target.parentElement.parentElement.parentElement.getAttribute('data-guid');
	let plugin = findPlugin(true, guid);
	if (isCommercialPluginConfig(plugin)) {
		onClickLearnMore(target, null);
		return;
	}
	// we should do that because we have some problem when desktop is loading plugin
	if (isLocal) {
		toogleLoader(true, 'Updating');
	} else {
		clearTimeout(timeout);
		timeout = setTimeout(toogleLoader, 200, true, "Updating");
	}
	updateCount++;
	let message = {
		type : 'update',
		url : plugin.url,
		guid : guid,
		config : plugin
	};
	let gateResult = await ensureCommercialAccess(message.config);
	if (gateResult && gateResult.allowed === false) {
		toogleLoader(false);
		return;
	}
	trackGoal('plugin_update_click', {
		plugin_guid: guid,
		plugin_name: getPluginLabelByGuid(guid)
	});
	// we should do that because we have some problem when desktop is loading plugin
	if (isLocal) {
		setTimeout(function() {
			sendMessage(message);
		}, 200);
	} else {
		sendMessage(message);
	}
};

function onClickRemove(target, event) {
	event.stopImmediatePropagation();
	let guid = target.parentNode.parentNode.getAttribute('data-guid');
	let plugin = findPlugin(true, guid);
	if (isCommercialPluginConfig(plugin)) {
		onClickLearnMore(target, event);
		return;
	}
	let pluginName = getPluginLabelByGuid(guid);
	requestRemoveConfirmation(pluginName, function() {
		if (isLocal) {
			toogleLoader(true, 'Removal');
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(toogleLoader, 200, true, 'Removal');
		}
		let message = {
			type : 'remove',
			guid : guid,
			backup : needBackupPlugin(guid)
		};
		trackGoal('plugin_remove_click', {
			plugin_guid: guid,
			plugin_name: pluginName
		});
		sendMessage(message);
	});
};

function needBackupPlugin(guid) {
	// проверяем установленный плагин:
	// если плагин есть в стор ( и его версия <= ? ), то можем удалить, пользователь сможет поставить актуальную версию
	// если плагина нет в стор, нужно его хранить у пользователя с возможностью восстановления

	return isLocal ? findPlugin(true, guid) == undefined : false;
}

async function onClickUpdateAll() {
	clearTimeout(timeout);
	timeout = setTimeout(toogleLoader, 200, true, "Updating");
	elements.btnUpdateAll.classList.add('hidden');
	trackGoal('plugin_update_all_click', {
		pending_updates: allPlugins.filter(function(el) { return el.bHasUpdate; }).length
	});
	let arr = allPlugins.filter(function(el) {
		return el.bHasUpdate && !isCommercialPluginConfig(el);
	});
	if (!arr.length) {
		toogleLoader(false);
		checkNoUpdated(true);
		return;
	}
	updateCount = arr.length;
	arr.forEach(function(plugin) {
		let message = {
			type : 'update',
			url : plugin.url,
			guid : plugin.guid,
			config : plugin
		};
		sendMessage(message);
	});
};

function onClickItem() {
	// There we will make preview for selected plugin
	let offered = "Ascensio System SIA";
	let hiddenCounter = 0;
	let guid = this.getAttribute('data-guid');
	trackGoal('plugin_open_card', {
		plugin_guid: guid,
		plugin_name: getPluginLabelByGuid(guid)
	});
	let pluginDiv = document.getElementById(guid);
	let divPreview = document.createElement('div');
	divPreview.id = 'div_preview';
	divPreview.className = 'div_preview';

	let installed = findPlugin(false, guid);
	let plugin = findPlugin(true, guid);
	let isCommercial = isCommercialPluginConfig(plugin || (installed ? installed.obj : null));
	let discussionUrl = plugin ? plugin.discussionUrl : null;
	
	if (plugin && plugin.rating) {
		elements.divRatingLink.removeAttribute('title');
		elements.totalVotes.innerText = plugin.rating.total;
		document.getElementById('stars_colored').style.width = plugin.rating.percent;
		elements.discussionLink.classList.remove('hidden');
		elements.divVotes.classList.remove('hidden');
	} else {
		document.getElementById('stars_colored').style.width = 0;
		elements.divVotes.classList.add('hidden');
		elements.discussionLink.classList.add('hidden');
		if (!discussionCount)
			elements.divRatingLink.setAttribute('title', getTranslated('No disscussion page for this plugin.'));
	}
	if (isCommercial) {
		elements.divVotes.classList.add('hidden');
		elements.discussionLink.classList.add('hidden');
	}

	if ( !plugin || ( isLocal && installed && plugin.baseUrl.includes('file:') ) ) {
		elements.divGitLink.classList.add('hidden');
		plugin = installed.obj;
	} else {
		elements.divGitLink.classList.remove('hidden');
	}

	selectedPluginLicenseSource = plugin.baseUrl || plugin.url || '';
	selectedPluginLicenseKey = '';
	selectedLicenseLoaded = false;
	ensurePluginChangelogLoaded(plugin);
	if (elements.divLicensePreview)
		elements.divLicensePreview.innerHTML = renderMarkdown('Загрузка лицензии плагина...');

	let bWebUrl = !plugin.baseUrl.includes('http://') && !plugin.baseUrl.includes('file:') && !plugin.baseUrl.includes('../');
	let bCorrectUrl = isLocal || bWebUrl;

	if (bCorrectUrl && plugin.variations[0].store && plugin.variations[0].store.screenshots && plugin.variations[0].store.screenshots.length) {
		let arrScreens = plugin.variations[0].store.screenshots;
		arrScreens.forEach(function(screenUrl, ind) {
			let url = plugin.baseUrl + screenUrl;
			let container = document.createElement('div');
			container.className = 'mySlides fade';
			let screen = document.createElement('img');
			screen.className = 'screen';
			screen.setAttribute('src', url);
			container.appendChild(screen);
			document.getElementById('div_selected_container').insertBefore(container, elements.arrowPrev);
			if (arrScreens.length > 1) {
				let point = document.createElement('span');
				point.className = 'dot';
				point.onclick = function() {
					currentSlide(ind+1);
				};
				document.getElementById('points_container').appendChild(point);
			}
		});
		if (arrScreens.length > 1) {
			elements.arrowPrev.classList.remove('hidden');
			elements.arrowNext.classList.remove('hidden');
		}
		slideIndex = 1;
		showSlides(1);
	} else {
		elements.arrowPrev.classList.add('hidden');
		elements.arrowNext.classList.add('hidden');
	}

	let bHasUpdate = (pluginDiv.lastChild.firstChild.lastChild.tagName === 'SPAN' && !pluginDiv.lastChild.firstChild.lastChild.classList.contains('hidden'));
	let typeLabel = getPluginTypeLabel(plugin, plugin.variations[0]);
	
	if ( (installed && installed.obj.version) || plugin.version ) {
		elements.spanVersion.innerText = (installed && installed.obj.version ? installed.obj.version : plugin.version);
		elements.divVersion.classList.remove('hidden');
	} else {
		elements.spanVersion.innerText = '';
		elements.divVersion.classList.add('hidden');
		hiddenCounter++;
	}

	if ( (installed && installed.obj.minVersion) || plugin.minVersion ) {
		elements.spanMinVersion.innerText = (installed && installed.obj.minVersion ? installed.obj.minVersion : plugin.minVersion);
		elements.divMinVersion.classList.remove('hidden');
	} else {
		elements.spanMinVersion.innerText = '';
		elements.divMinVersion.classList.add('hidden');
		hiddenCounter++;
	}	

	if (plugin.languages) {
		elements.spanLanguages.innerText = plugin.languages.join(', ') + '.';
		elements.divLanguages.classList.remove('hidden');
	} else {
		elements.spanLanguages.innerText = '';
		elements.divLanguages.classList.add('hidden');
		hiddenCounter++;
	}

	if (plugin.changelog) {
		document.getElementById('span_changelog').classList.remove('hidden');
		document.getElementById('div_changelog_preview').innerHTML = plugin.changelog;
	} else {
		document.getElementById('span_changelog').classList.add('hidden');
		document.getElementById('div_changelog_preview').innerHTML = '';
	}

	let pluginUrl = plugin.baseUrl.replace(OOMarketplaceUrl, (OOIO + 'tree/main/') );
	
	// TODO problem with plugins icons (different margin from top)
	elements.divSelected.setAttribute('data-guid', guid);
	// we do this, because new icons for store are too big for use it in this window.
	let tmp = getImageUrl(guid, false, true, 'img_icon');
	document.getElementById('div_icon_info').style.background = this.firstChild.style.background;
	elements.imgIcon.setAttribute('src', tmp);
	elements.spanName.innerHTML = this.children[1].children[0].innerText;
	elements.spanOffered.innerHTML = plugin.offered || offered;
	if (typeLabel)
		elements.spanOffered.innerHTML += ' · ' + typeLabel;
	elements.spanSelectedDescr.innerHTML = this.children[1].children[1].innerText;
	if (bWebUrl) {
		elements.linkPlugin.setAttribute('href', pluginUrl);
		elements.linkReadme.setAttribute('href', pluginUrl + 'README.md');
		elements.divReadme.classList.remove('hidden');
	} else {
		elements.linkPlugin.setAttribute('href', '');
		elements.linkReadme.setAttribute('href', '');
		elements.divReadme.classList.add('hidden');
	}
	
	if (discussionUrl && !isCommercial)
		elements.discussionLink.setAttribute('href', discussionUrl);
	else
		elements.discussionLink.removeAttribute('href');

	if (bHasUpdate && !isCommercial) {
		elements.btnUpdate.classList.remove('hidden');
	} else {
		elements.btnUpdate.classList.add('hidden');
	}

	if (isCommercial) {
		elements.btnRemove.classList.add('hidden');
		elements.btnInstall.classList.add('hidden');
		if (elements.btnLearnMore) {
			elements.btnLearnMore.classList.remove('hidden');
			elements.btnLearnMore.onclick = function(event) {
				onClickLearnMore(event.currentTarget, event);
			};
		}
	} else if (installed && !installed.removed) {
		if (installed.canRemoved) {
			elements.btnRemove.classList.remove('hidden');
		} else {
			elements.btnRemove.classList.add('hidden');
		}
		elements.btnInstall.classList.add('hidden');
	} else {
		elements.btnRemove.classList.add('hidden');
		elements.btnInstall.classList.remove('hidden');
		if (elements.btnLearnMore)
			elements.btnLearnMore.classList.add('hidden');
	}

	if (!isCommercial && elements.btnLearnMore)
		elements.btnLearnMore.classList.add('hidden');

	if (pluginDiv.lastChild.lastChild.hasAttribute('disabled')) {// || pluginDiv.lastChild.lastChild.hasAttribute('dataDisabled')) {
		elements.btnInstall.setAttribute('disabled','');
		elements.btnInstall.setAttribute('title', getTranslated(messages.versionWarning));
	} else {
		elements.btnInstall.removeAttribute('disabled');
		elements.btnInstall.removeAttribute('title');
	}

	if (hiddenCounter == 3) {
		// if versions and languages fields are hidden, we should hide this div
		document.getElementById('div_plugin_info').classList.add('hidden');
	} else {
		document.getElementById('div_plugin_info').classList.remove('hidden');
	}

	elements.divSelected.classList.remove('hidden');
	elements.divSelectedMain.classList.remove('hidden');
	elements.divBody.classList.add('hidden');
	setDivHeight();
	sendMessage( { type : "showButton", show : true } );
	// elements.arrow.classList.remove('hidden');
};

function onClickBack() {
	// click on left arrow in preview mode
	elements.imgIcon.style.display = 'none';
	$('.dot').remove();
	$('.mySlides').remove();
	elements.arrowPrev.classList.add('hidden');
	elements.arrowNext.classList.add('hidden');
	document.getElementById('span_overview').click();
	elements.divSelected.classList.add('hidden');
	elements.divSelectedMain.classList.add('hidden');
	elements.divBody.classList.remove('hidden');
	if(PsMain) PsMain.update();
};

function onSelectPreview(target, type) {
	// change mode of preview
	if ( !target.classList.contains('span_selected') ) {
		$(".span_selected").removeClass("span_selected");
		target.classList.add("span_selected");
		$(".div_selected_preview").addClass("hidden");

		// type: 1 - Overview; 2 - Info; 3 - Changelog;
		if (type === 1) {
			document.getElementById('div_selected_preview').classList.remove('hidden');
			setDivHeight();
		} else if (type === 2) {
			document.getElementById('div_selected_info').classList.remove('hidden');
		} else if (type === 3) {
			document.getElementById('div_selected_changelog').classList.remove('hidden');
			PsChangelog.update();
		} else {
			document.getElementById('div_selected_license').classList.remove('hidden');
			loadSelectedLicensePreview();
		}
	}
};

function createNotification(text, err) {
	// creates any notification for user inside elements.divMain window (you should clear this element before making notification)
	let div = document.createElement('div');
	div.className = 'div_notification';
	if (err) {
		let icon = document.createElement('div');
		icon.className = 'icon_notification';
		div.appendChild(icon);
		let spanErr = document.createElement('span');
		spanErr.className = 'error_caption';
		spanErr.innerHTML = getTranslated(err);
		div.appendChild(spanErr);
	}
	let spanNot = document.createElement('span');
	spanNot.className = 'span_notification text-secondary';
	spanNot.innerHTML = getTranslated(text);
	div.appendChild(spanNot);
	if (text === 'Nothing was found for this query.')
		div.classList.add('div_notification_empty');
	elements.divMain.appendChild(div);
};

function createError(err, bDontShow) {
	// creates a modal window with error message for user and error in console
	console.error(err);
	let divErr = document.getElementById('div_error');
	// we don't show a new error if we have previous one
	if (!divErr.classList.contains('hidden') || bDontShow)
		return;
	let background = document.createElement('div');
	background.className = 'asc-plugin-loader';
	let span = document.createElement('span');
	span.className = 'error_caption';
	let message = err.message || 'Problem with loading some resources';
	span.innerHTML = getTranslated(message);
	background.appendChild(span);
	divErr.appendChild(background);
	divErr.classList.remove('hidden');
	setTimeout(function() {
		// remove error after 5 seconds
		$(background).remove();
		divErr.classList.add('hidden');
	}, 5000);
};

function setDivHeight() {
	// set height for div with image in preview mode
	if (PsMain) PsMain.update();
	// console.log(Math.round(window.devicePixelRatio * 100));
	if (elements.divScreen) {
		let height = elements.divScreen.parentNode.clientHeight - elements.divScreen.previousElementSibling.clientHeight - 70 + 'px';
		elements.divScreen.style.height = height;
		elements.divScreen.style.maxHeight = height;
		if (isIE) {
			// elements.imgScreenshot.style.maxHeight = height;
			// elements.imgScreenshot.style.maxWidth = elements.divScreen.clientWidth + 'px';
		}
	}
};

window.onresize = function(bForce) {
	if (scale.devicePR !== window.devicePixelRatio || bForce) {
		let html = document.getElementsByTagName('html')[0];
		scale.devicePR = window.devicePixelRatio;
		let revZoom = 1 / scale.devicePR;
		if (scale.devicePR > 2)
			revZoom *= 2;

		if (1 <= scale.devicePR && scale.devicePR <= 2 || isResizeOnStart) {
			setDivHeight();
			let oldScale = scale.value;
			isResizeOnStart = false;
			if (scale.devicePR < 1)
				return;

			calculateScale();
			html.setAttribute('style', '');

			if (scale.value !== oldScale)
				changeIcons();
		} else if (scale.devicePR < 1) {
			html.style.zoom = revZoom;
			// html.style['-moz-transform'] = 'scale('+ revZoom +')';
		}
		$('.div_item').css('border', ((revZoom > 1 ? 1 : revZoom) +'px solid ' + (themeType == 'ligh' ? '#c0c0c0' : '#666666')));
	}
	if (PsChangelog) PsChangelog.update();
};

// zoom on start if we start with a non 100% zoom
if (scale.devicePR < 1) {
	// maybe remove this flag
	isResizeOnStart = false;
	window.onresize(true);
}

function calculateScale() {
	let bestIndex = 0;
	scale.devicePR = window.devicePixelRatio;
	let bestDistance = Math.abs(supportedScaleValues[0] - scale.devicePR);
	let currentDistance = 0;
	for (let i = 1, len = supportedScaleValues.length; i < len; i++) {
		if (true) {
			if (Math.abs(supportedScaleValues[i] - scale.devicePR) > 0.0001) {
				if ( (supportedScaleValues[i] - 0.0501) > (scale.devicePR - 0.0001))
					break;
			}
		}

		currentDistance = Math.abs(supportedScaleValues[i] - scale.devicePR);
		if (currentDistance < (bestDistance - 0.0001)) {
			bestDistance = currentDistance;
			bestIndex = i;
		}
	}
	scale.percent = supportedScaleValues[bestIndex] * 100 + '%';
	scale.value = supportedScaleValues[bestIndex];
};

function changeIcons() {
	let arr = document.getElementsByClassName('plugin_icon');
	for (let i = 0; i < arr.length; i++) {
		let guid = arr[i].getAttribute('data-guid');
		arr[i].setAttribute( 'src', getImageUrl( guid, false, true, ('img_' + guid) ) );
	}
	let guid = elements.imgIcon.parentNode.parentNode.parentNode.getAttribute('data-guid');
	elements.imgIcon.setAttribute('src', getImageUrl(guid, false, true, 'img_icon'));
};

function getTranslation() {
	// gets translation for current language
	if (shortLang != "en") {
		isTranslationLoading = true
		makeRequest('./translations/langs.json', 'GET', null, null, true).then(
			function(response) {
				let arr = JSON.parse(response);
				let fullName, shortName;
				for (let i = 0; i < arr.length; i++) {
					let file = arr[i];
					if (file == lang) {
						fullName = file;
						break;
					} else if (file.split('-')[0] == shortLang) {
						shortName = file;
					}
				}
				if (fullName || shortName) {
					bTranslate = true;
					makeRequest('./translations/' + (fullName || shortName) + '.json', 'GET', null, null, true).then(
						function(res) {
							// console.log('getTranslation: ' + (Date.now() - start));
							translate = JSON.parse(res);
							isTranslationLoading = false;
							onTranslate();
						},
						function(err) {
							createError( new Error('Cannot load translation for current language.') );
							isTranslationLoading = false;
							showMarketplace();
						}
					);
				} else {
					isTranslationLoading = false;
					showMarketplace();
				}	
			},
			function(err) {
				createError( new Error('Cannot load translations list file.') );
				isTranslationLoading = false;
				showMarketplace();
			}
		);
	} else {
		isTranslationLoading = false;
		showMarketplace();
	}
};

function onTranslate() {
	// translates elements on current language
	if (isFrameLoading || isTranslationLoading)
		return;

	elements.linkNewPlugin.innerHTML = getTranslated(messages.linkPR);
	elements.btnAvailablePl.innerHTML = getTranslated('Installed');
	elements.btnMarketplace.innerHTML = getTranslated('Catalog');
	if (elements.btnSettings)
		elements.btnSettings.innerHTML = getTranslated('Settings');
	if (elements.btnLicense) {
		elements.btnLicense.title = getTranslated('License');
		elements.btnLicense.setAttribute('aria-label', getTranslated('License'));
	}
	elements.btnInstall.innerHTML = getTranslated('Install');
	if (elements.btnLearnMore)
		elements.btnLearnMore.innerHTML = getTranslated(messages.learnMore);
	elements.btnRemove.innerHTML = getTranslated('Remove');
	elements.btnUpdate.innerHTML = getTranslated('Update');
	elements.btnUpdateAll.innerHTML = getTranslated('Update All');
	if (elements.removeConfirmTitle)
		elements.removeConfirmTitle.innerHTML = getTranslated(messages.removeConfirmTitle);
	if (elements.removeConfirmText)
		elements.removeConfirmText.innerHTML = getTranslated(messages.removeConfirmPrompt);
	if (elements.btnRemoveConfirmCancel)
		elements.btnRemoveConfirmCancel.innerHTML = getTranslated('No');
	if (elements.btnRemoveConfirmOk)
		elements.btnRemoveConfirmOk.innerHTML = getTranslated('Yes');
	elements.inpSearch.placeholder = getTranslated('Search plugins') + '...';
	document.getElementById('lbl_header').innerHTML = 'R7 Consult';
	document.getElementById('lbl_subtitle').innerHTML = getTranslated('Сatalog and installer plugin');
	let rightsNotice = document.getElementById('lbl_r7c_rights');
	if (rightsNotice)
		rightsNotice.innerHTML = getTranslated('Plugin marketplace is powered by R7 Consult. All rights reserved.');
	document.getElementById('span_offered_caption').innerHTML = getTranslated('Offered by') + ' ';
	document.getElementById('span_overview').innerHTML = getTranslated('Overview');
	document.getElementById('span_info').innerHTML = getTranslated('Info & Support');
	document.getElementById('span_license').innerHTML = getTranslated('License');
	document.getElementById('span_lern').innerHTML = getTranslated('Learn how to use') + ' ';
	document.getElementById('span_lern_plugin').innerHTML = getTranslated('the plugin in') + ' ';
	document.getElementById('span_contribute').innerHTML = getTranslated('Contribute') + ' ';
	document.getElementById('span_contribute_end').innerHTML = getTranslated('to the plugin development or report an issue on') + ' ';
	document.getElementById('span_help').innerHTML = getTranslated('Get help') + ' ';
	document.getElementById('span_help_end').innerHTML = getTranslated('with the plugin functionality on our forum.');
	document.getElementById('span_create').innerHTML = getTranslated('Create a new plugin using') + ' ';
	document.getElementById('span_ver_caption').innerHTML = getTranslated('Version') + ': ';
	document.getElementById('span_min_ver_caption').innerHTML = getTranslated('The minimum supported editors version') + ': ';
	document.getElementById('span_langs_caption').innerHTML = getTranslated('Languages') + ': ';
	document.getElementById('span_categories').innerHTML = getTranslated('Categories');
	document.getElementById('opt_all').innerHTML = getTranslated('All categories');
	document.getElementById('opt_rec').innerHTML = getTranslated('Recommended');
	document.getElementById('opt_commercial').innerHTML = getTranslated('Commercial');
	document.getElementById('opt_dev').innerHTML = getTranslated('Developer tools');
	document.getElementById('opt_work').innerHTML = getTranslated('Work');
	document.getElementById('opt_enter').innerHTML = getTranslated('Entertainment');
	document.getElementById('opt_com').innerHTML = getTranslated('Communication');
	document.getElementById('opt_spec').innerHTML = getTranslated('Special abilities');
	document.getElementById('discussion_link').innerHTML = getTranslated('Click to rate');
	if (elements.btnSettings)
		elements.btnSettings.title = getTranslated('Settings');
	if (elements.btnReload) {
		elements.btnReload.title = getTranslated('Reload');
		elements.btnReload.setAttribute('aria-label', getTranslated('Reload'));
	}
	if (elements.btnSettingsClose)
		elements.btnSettingsClose.title = getTranslated('Close');
	if (elements.settingsTitle)
		elements.settingsTitle.innerHTML = getTranslated('Settings');
	if (elements.btnThemeLight)
		elements.btnThemeLight.innerHTML = getTranslated('Light');
	if (elements.btnThemeDark)
		elements.btnThemeDark.innerHTML = getTranslated('Dark');
	showMarketplace();
};

function showMarketplace() {
	// show main window to user
	if (!isPluginLoading && !isTranslationLoading && !isFrameLoading && installedPlugins) {
		createSelect();
		if (isOnline)
			showListofPlugins(isOnline);
		else {
			toogleView(elements.btnAvailablePl, elements.btnMarketplace, messages.linkManually, false, false);
			toogleLoader(false);
		}
			
		catFiltred = allPlugins;
		// elements.divBody.classList.remove('hidden');
		elements.divBody.classList.remove('transparent');

		// console.log('showMarketplace: ' + (Date.now() - start));
		// we are removing the header for now, since the plugin has its own
		// elements.divHeader.classList.remove('hidden');
	}
};

function createSelect() {
	$('#select_categories').select2({
		minimumResultsForSearch: Infinity
	}).on('change', function(event) {
		filterByCategory(event.currentTarget.value);
	});

	// $('#select_sortBy').select2({
	// 	minimumResultsForSearch: Infinity
	// }).on('change', function(event) {
	// 	console.log(event.currentTarget.value);
	// });
};

function getIconNormalByScale(iconSet) {
	if (!iconSet || typeof iconSet !== 'object')
		return '';
	let scaleConfig = iconSet[scale.percent] || iconSet['100%'] || iconSet['*'];
	if (scaleConfig && typeof scaleConfig === 'object' && scaleConfig.normal)
		return scaleConfig.normal;
	return '';
}

function getImageUrl(guid, bNotForStore, bSetSize, id) {
	// get icon url for current plugin (according to theme and scale)
	let iconScale = '/icon.png';
	switch (scale.percent) {
		case '125%':
			iconScale = '/icon@1.25x.png'
			break;
		case '150%':
			iconScale = '/icon@1.5x.png'
			break;
		case '175%':
			iconScale = '/icon@1.75x.png'
			break;
		case '200%':
			iconScale = '/icon@2x.png'
			break;
	}
	let curIcon = './resources/img/defaults/' + (bNotForStore ? ('info/' + themeType) : 'card') + iconScale;
	let plugin;
	// We have a problem with "http" and "file" routes.
	// In desktop we have a local installed marketplace. It's why we use local routes only for desktop.
	let baseUrl;

	if (installedPlugins && isLocal) {
		// it doesn't work when we use icons from other resource (cors problems)
		// it's why we use local icons only for desktop
		plugin = findPlugin(false, guid);
		if (plugin) {
			plugin = plugin.obj;
			baseUrl = plugin.baseUrl;
		}
	}

	if ( ( !plugin || !isLocal ) && allPlugins) {
		plugin = findPlugin(true, guid);
		if (plugin)
			baseUrl = plugin.baseUrl;
	}
	// github doesn't allow to use "http" or "file" as the URL for an image
	if ( plugin && ( baseUrl.includes('https://') || isLocal) ) {
		let variation = plugin.variations[0];
		
		if (!bNotForStore && variation.store && variation.store.icons) {
			// icons are in config of store field (work only with new scheme)
			// it's an object with 2 fields (for dark and light theme), which contain route to icons folder
			curIcon = baseUrl + variation.store.icons[themeType] + iconScale;
		} else if (variation.icons2) {
			// it's old scheme. There could be an array with objects which have theme field or an array from one object without theme field
			let icon = variation.icons2[0];
			for (let i = 1; i < variation.icons2.length; i++) {
				if ( themeType.includes(variation.icons2[i].style) ) {
					icon = variation.icons2[i];
					break;
				}
			}
			let iconNormal = getIconNormalByScale(icon);
			if (iconNormal)
				curIcon = baseUrl + iconNormal;
		} else if (variation.icons) {
			// there could be old and new scheme
			// there will be a string array or object like icons2 above (old scheme)
			// there will be a object with 2 fields (for dark and light theme), which contain route to icons folder (new scheme)
			if (!Array.isArray(variation.icons)) {
				// new scheme
				curIcon = baseUrl + variation.icons[themeType] + iconScale;
			} else {
				// old scheme
				if (typeof(variation.icons[0]) == 'object' ) {
					// old scheme and icons like icons2 above
					let icon = variation.icons[0];
					for (let i = 1; i < variation.icons.length; i++) {
						if ( themeType.includes(variation.icons[i].style) ) {
							icon = variation.icons[i];
							break;
						}
					}
					let iconNormal = getIconNormalByScale(icon);
					if (iconNormal)
						curIcon = baseUrl + iconNormal;
				} else {
					// old scheme and icons is a string array
					let iconPath = (scale.value >= 1.2 ? variation.icons[1] : variation.icons[0]) || variation.icons[0];
					if (iconPath && /@\d+(?:\.\d+)?x\.svg$/i.test(iconPath) && variation.icons[0] && /\.svg$/i.test(variation.icons[0]))
						iconPath = variation.icons[0];
					if (iconPath)
						curIcon = baseUrl + iconPath;
				}
			}
		}	
	}

	if (bSetSize) {
		makeRequest(curIcon, 'GET', 'blob', null, true).then(
			function (res) {
				let reader = new FileReader();
				reader.onloadend = function() {
					let imageUrl = reader.result;		
					let img = document.createElement('img');
					img.setAttribute('src', imageUrl);
					img.onload = function () {
						let icon = document.getElementById(id);
						if (!icon)
							return;
						icon.style.width = ( (img.width/scale.value) >> 0 ) + 'px';
						icon.style.height = ( (img.height/scale.value) >> 0 ) + 'px';
						icon.style.display = '';
					}
					
				}
				reader.readAsDataURL(res);
			},
			function(error) {
				// optional image prefetch for sizing can fail on missing icon variants; keep default sizing silently
			}
		);
	}
	
	return curIcon;
};

function getUrlSearchValue(key) {
	let res = '';
	if (window.location && window.location.search) {
		let search = window.location.search;
		let pos1 = search.indexOf(key + '=');
		if (-1 != pos1) {
			pos1 += key.length + 1;
			let pos2 = search.indexOf("&", pos1);
			res = search.substring(pos1, (pos2 != -1 ? pos2 : search.length) )
		}
	}
	return res;
};

function toogleView(current, oldEl, text, bAll, bForce) {
	if ( !current.classList.contains('btn_toolbar_active') || bForce ) {
		trackGoal(bAll ? 'tab_catalog_open' : 'tab_installed_open');
		elements.inpSearch.value = '';
		founded = [];
		oldEl.classList.remove('btn_toolbar_active');
		current.classList.add('btn_toolbar_active');
		elements.linkNewPlugin.innerHTML = getTranslated(text);
		let toolbar = document.getElementById('toolbar_tools');
		let flag = !isLocal && !isOnline;
		if ( ( bAll && (!isOnline || isPluginLoading) ) || flag) {
			$('.div_notification').remove();
			$('.div_item').remove();
			setTimeout(function(){if (PsMain) PsMain.update()});
			toolbar.classList.add('hidden');
			createNotification('No Internet Connection.', 'Problem with loading some resources')
		} else {
			toolbar.classList.remove('hidden');
			if (document.getElementById('select_categories').value == 'all') {
				showListofPlugins(bAll);
				catFiltred = bAll ? allPlugins : installedPlugins;
			} else {
				filterByCategory(document.getElementById('select_categories').value);
			}
		}
		elements.linkNewPlugin.href = bAll ? (OOIO + "pulls") : "https://api.onlyoffice.com/docs/plugin-and-macros/tutorials/installing/onlyoffice-docs-on-premises/";

		if (isLocal && !bAll) {
			elements.linkNewPlugin.href = "#";
			elements.linkNewPlugin.onclick = function (e) {
				e.preventDefault();
				installPluginManually();
			}
		}
	}
};

function installPluginManually() {
	window["AscDesktopEditor"]["OpenFilenameDialog"]("plugin", false, function (_file) {
		var file = _file;
		if (Array.isArray(file))
			file = file[0];

		let result = window["AscDesktopEditor"]["PluginInstall"](file);
		if (result) {
			trackGoal('plugin_install_manual_success');
			// нужно обновить список установленных плагинов
			sendMessage({ type: 'getInstalled', updateInstalled: true }, '*');
		} else {
			createError(new Error('Problem with plugin installation.'), false);
		}
	});
};

function sortPlugins(bAll, bInst, type) {
	switch (type) {
		case 'rating':
			// todo
			break;
		case 'instalations':
			// todo
			break;
		case 'start':
			if (bInst) {
				let guarded = [];
				let removed = [];
				let arr = [];
				installedPlugins.forEach(function(pl) {
					if (!pl.canRemoved)
						guarded.push(pl);
					else if (pl.removed)
						removed.push(pl);
					else
						arr.push(pl);
				});
				installedPlugins = guarded.concat(arr, removed);
			}
			break;
	
		default:
			if (bAll) {
				allPlugins.sort(function(a, b) {
					return a.name.localeCompare(b.name);
				});
			}
			if (bInst) {
				installedPlugins.sort(function(a, b) {
					return a.obj.name.localeCompare(b.obj.name);
				});
			}
			break;
	}
};

function makeSearch(val) {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(function() {
		let plugins = catFiltred;
		let bUpdate = false;
		let arr = plugins.filter(function(el) {
			let plugin = el.obj || el;
			let name = (plugin.nameLocale && ( plugin.nameLocale[lang] || plugin.nameLocale[shortLang] ) ) ? ( plugin.nameLocale[lang] || plugin.nameLocale[shortLang] ) : plugin.name;
			return name.toLowerCase().includes(val);
		});

		if (founded.length == arr.length) {
			if (JSON.stringify(founded) != JSON.stringify(arr)) {
				founded = arr;
				bUpdate = true;
			}
		} else {
			founded = arr;
			bUpdate = true;
		}

		if (founded.length) {
			if (bUpdate)
				showListofPlugins(elements.btnMarketplace.classList.contains('btn_toolbar_active'), founded);
		} else {
			showListofPlugins(elements.btnMarketplace.classList.contains('btn_toolbar_active'), []);
		}
	}, 100);
};

function filterByCategory(category) {
	let plugins = elements.btnMarketplace.classList.contains('btn_toolbar_active') ? allPlugins : installedPlugins;
	let arr;
	if (category != "all") {
		arr = plugins.filter(function(plugin) {
			let pluginObj = plugin.variations ? plugin : plugin.obj;
			if (!pluginObj || !pluginObj.variations || !pluginObj.variations[0])
				return false;
			if (category === 'commercial')
				return isCommercialPluginConfig(pluginObj);
			let variation = pluginObj.variations[0];
			let arrCat = (variation.store && variation.store.categories) ? variation.store.categories : [];
			return arrCat.includes(category);
		});
	} else {
		arr = plugins;
	}
	catFiltred = arr;
	if (elements.inpSearch.value.trim() == '')
		showListofPlugins(elements.btnMarketplace.classList.contains('btn_toolbar_active'), arr);
	else
		makeSearch(elements.inpSearch.value.trim().toLowerCase());
};

function removeUnloaded(unloaded) {
	unloaded.forEach(function(el){
		allPlugins.splice(el, 1);
	})
};

function findPlugin(bAll, guid) {
	let res = bAll
			? allPlugins.find(function(el){return el.guid === guid})
			: installedPlugins.find(function(el){return el.guid === guid});
	return res;
};

function changeAfterInstallOrRemove(bInstall, guid, bHasLocal) {
	let card = this.document.getElementById(guid);
	if (!card)
		return;
	let btn = card.querySelector('.btn_item');
	let status = card.querySelector('.card_status');
	let plugin = findPlugin(true, guid);
	if (!plugin) {
		let installedRef = findPlugin(false, guid);
		plugin = installedRef ? installedRef.obj : null;
	}
	if (isCommercialPluginConfig(plugin)) {
		if (status) {
			status.innerHTML = getTranslated('Commercial');
			status.classList.add('status_commercial');
			status.classList.remove('status_installed');
		}
		if (btn) {
			btn.innerHTML = getTranslated(messages.learnMore);
			btn.classList.add('btn_learn_more', 'btn_install');
			btn.classList.remove('btn_remove');
			btn.onclick = function(e) {
				onClickLearnMore(e.target, e);
			};
			btn.removeAttribute('disabled');
			btn.removeAttribute('title');
		}
		if (!elements.divSelected.classList.contains('hidden')) {
			this.document.getElementById('btn_install').classList.add('hidden');
			this.document.getElementById('btn_remove').classList.add('hidden');
			this.document.getElementById('btn_update').classList.add('hidden');
			if (elements.btnLearnMore)
				elements.btnLearnMore.classList.remove('hidden');
		}
		return;
	}
	if (status) {
		status.innerHTML = getTranslated(bInstall ? 'Installed' : 'Not installed');
		status.classList.toggle('status_installed', bInstall);
	}
	if (btn) {
		btn.innerHTML = getTranslated( ( bInstall ? 'Remove' : 'Install' ) );
		btn.classList.add( ( bInstall ? 'btn_remove' : 'btn_install' ) );
		btn.classList.remove( ( bInstall ? 'btn_install' : 'btn_remove' ) );
		btn.onclick = function(e) {
			if (bInstall)
				onClickRemove(e.target, e);
			else
				onClickInstall(e.target, e);
		};
		// We need to keep the ability to install the local version that has been removed (maybe we should change the button)
		if ( !bInstall && btn.hasAttribute('dataDisabled') && !bHasLocal ) {
			btn.setAttribute('title', getTranslated(messages.versionWarning));
			btn.setAttribute('disabled', '');
		} else {
			btn.removeAttribute('disabled');
		}
	}

	if (!elements.divSelected.classList.contains('hidden')) {
		this.document.getElementById( ( bInstall ? 'btn_install' : 'btn_remove' ) ).classList.add('hidden');
		this.document.getElementById( ( bInstall ? 'btn_remove' : 'btn_install' ) ).classList.remove('hidden');
		if (bInstall && bHasUpdate)
			this.document.getElementById('btn_update').classList.remove('hidden');
		else
			this.document.getElementById('btn_update').classList.add('hidden');
		if (elements.btnLearnMore)
			elements.btnLearnMore.classList.add('hidden');
	}
	checkNoUpdated(!bInstall);
};

function onClickLearnMore(target, event) {
	if (event && typeof event.stopImmediatePropagation === 'function')
		event.stopImmediatePropagation();
	let card = target ? target.closest('.div_item') : null;
	let guid = card ? card.getAttribute('data-guid') : (elements.divSelected ? elements.divSelected.getAttribute('data-guid') : '');
	let plugin = findPlugin(true, guid);
	if (!plugin) {
		let installed = findPlugin(false, guid);
		plugin = installed ? installed.obj : null;
	}
	let url = getCommercialLandingUrl(plugin) || 'https://r7-consult.ru/';
	trackGoal('plugin_learn_more_click', {
		plugin_guid: guid,
		plugin_name: getPluginLabelByGuid(guid)
	});
	openExternalUrl(url);
}

function checkInternet() {
	// url for check internet connection
	let url = 'https://onlyoffice.github.io/store/translations/langs.json';
	makeRequest(url, 'GET', null, null, true).then(
		function() {
			isOnline = true;
			let bShowSelected = elements.divSelected && !elements.divSelected.classList.contains('hidden');
			let bshowMarketplace = bShowSelected ? false : ( ( elements.btnMarketplace && elements.btnMarketplace.classList.contains('btn_toolbar_active') ) ? true : false );
			if (!allPlugins.length) {
				fetchAllPlugins(interval === null, bshowMarketplace);
			} else if (bShowSelected) {
				let guid = elements.divSelected.getAttribute('data-guid');
				let div = document.getElementById(guid);
				if (div)
					div.onclick();
			} else if (bshowMarketplace) {
				toogleView(elements.btnMarketplace, elements.btnAvailablePl, messages.linkPR, true, true);
			} else if (!isLocal) {
				toogleView(elements.btnAvailablePl, elements.btnMarketplace, messages.linkManually, false, true);
			}
			clearInterval(interval);
			interval = null;
		}
	);
};

function handeNoInternet() {
	isOnline = false;
	if (!interval) {
		interval = setInterval(function() {
			checkInternet();
		}, 5000);
	}

	let bshowMarketplace = elements.btnMarketplace && elements.btnMarketplace.classList.contains('btn_toolbar_active');

	if ( (bshowMarketplace || !isLocal) && elements.divSelected && !elements.divSelected.classList.contains('hidden') ) {
		sendMessage( { type : "showButton", show : false } );
		onClickBack();
	}

	if (!document.getElementsByClassName('div_notification')[0]) {
		if (bshowMarketplace)
			toogleView(elements.btnMarketplace, elements.btnAvailablePl, messages.linkPR, true, true);
		else if (!isLocal)
			toogleView(elements.btnAvailablePl, elements.btnMarketplace, messages.linkManually, false, true);
	}
};

function getTranslated(text) {
	return translate[text] || text;
};

function trackGoal(goalName, params) {
	if (!goalName || typeof window.ym !== 'function')
		return;
	try {
		window.ym(107160430, 'reachGoal', goalName, params || {});
	} catch (e) {
		// ignore analytics errors
	}
}

function getPluginLabelByGuid(guid) {
	let plugin = findPlugin(true, guid);
	if (!plugin) {
		let installed = findPlugin(false, guid);
		plugin = installed ? installed.obj : null;
	}
	if (!plugin)
		return guid || 'unknown';
	if (bTranslate && plugin.nameLocale && (plugin.nameLocale[lang] || plugin.nameLocale[shortLang]))
		return plugin.nameLocale[lang] || plugin.nameLocale[shortLang];
	return plugin.name || guid || 'unknown';
}

function parseRatingPage(data) {
	// if we load this page, parse it
	let result = null;
	if (data !== 'Not Found') {
		try {
			let parser = new DOMParser();
			let doc = parser.parseFromString(data, "text/html");
			// we will have a problem if github change their page
			let first = Number(doc.getElementById('result-row-1').childNodes[1].childNodes[3].innerText.replace(/[\n\s%]/g,''));
			let second = Number(doc.getElementById('result-row-2').childNodes[1].childNodes[3].innerText.replace(/[\n\s%]/g,''));
			let third = Number(doc.getElementById('result-row-3').childNodes[1].childNodes[3].innerText.replace(/[\n\s%]/g,''));
			let fourth = Number(doc.getElementById('result-row-4').childNodes[1].childNodes[3].innerText.replace(/[\n\s%]/g,''));
			let fifth = Number(doc.getElementById('result-row-5').childNodes[1].childNodes[3].innerText.replace(/[\n\s%]/g,''));
			let total = Number(doc.getElementsByClassName('text-small color-fg-subtle')[0].childNodes[1].firstChild.textContent.replace(/[\n\sa-z]/g,''));
			first = Math.ceil(total * first / 100) * 5;   // it's 5 stars
			second = Math.ceil(total * second / 100) * 4; // it's 4 stars
			third = Math.ceil(total * third / 100) * 3;   // it's 3 stars
			fourth = Math.ceil(total * fourth / 100) * 2; // it's 2 stars
			fifth = Math.ceil(total * fifth / 100);       // it's 1 star
			let average = total === 0 ? 0 : (first + second + third + fourth + fifth) / total;
			let percent = average / 5 * 100 + '%';
			result = {
				total: total,
				average: average.toFixed(1),
				percent: percent
			};
		} catch (error) {
			// nothing to do
		}
	}
	return result;
};

function parseChangelog(data) {
	let arr = data.replace('# Change Log', '').split('\n\n## ');
	if (arr[0] == '')
		arr.shift();

	let indLast = arr.length - 1;
	let end = arr[0].indexOf('\n\n');
	let firstVersion = getPluginVersion( arr[0].slice(0, end) );
	end = arr[indLast].indexOf('\n\n');
	let lastVersion = getPluginVersion( arr[indLast].slice(0, end) );
	if (lastVersion > firstVersion)
		arr = arr.reverse();

	return ( '## ' + arr.join('\n\n## ') );
};

function checkNoUpdated(bRemove) {
	// todo it's a temp solution. We will change a work with updation in the feature.
	if ( (!elements.btnUpdateAll.classList.contains('hidden') && bRemove) || (elements.btnUpdateAll.classList.contains('hidden') && !bRemove) ) {
		let arr = document.getElementsByClassName('span_update');
		let bHasNoUpdated = false;
		for (let index = 0; index < arr.length; index++) {
			if (!arr[index].classList.contains('hidden')) {
				bHasNoUpdated = true;
				break;
			}
		}
		if (bHasNoUpdated) {
			elements.btnUpdateAll.classList.remove('hidden');
		} else {
			elements.btnUpdateAll.classList.add('hidden');
		}
	}
};

function plusSlides(n) {
	showSlides(slideIndex += n);
};

function currentSlide(n) {
	showSlides(slideIndex = n);
};

function showSlides(n) {
	let i;
	let slides = document.getElementsByClassName('mySlides');
	let dots = document.getElementsByClassName('dot');
	if (n > slides.length) {slideIndex = 1}    
	if (n < 1) {slideIndex = slides.length}
	for (i = 0; i < slides.length; i++) {
		slides[i].style.display = "none";  
	}
	for (i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(' active', '');
	}
	if (slides.length)
		slides[slideIndex-1].style.display = "block";

	if(dots.length)
		dots[slideIndex-1].className += ' active';
};

function getMarkedSetting() {
	// function for marked librry
	let defaults = {};
	const settings = {};
	if (typeof marked.getDefaults === 'function') {
		defaults = marked.getDefaults();
	} else if ('defaults' in marked) {
		for (let prop in marked.defaults) {
			defaults[prop] = marked.defaults[prop];
		}
	}

	const invalidOptions = [
		'renderer',
		'tokenizer',
		'walkTokens',
		'extensions',
		'highlight',
		'sanitizer'
	];

	for (let prop in defaults) {
		if (!invalidOptions.includes(prop))
		settings[prop] = defaults[prop]
	}

	return settings;
};
