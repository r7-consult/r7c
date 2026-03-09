(function () {
	const USERNAME_KEY = 'telegram_gate_username';

	const DEFAULT_CONFIG = Object.freeze({
		enabled: true,
		endpoint: 'http://89.169.162.67:11223/check_membership',
		apiKey: 'W-CFItpbMYic5W35YsQjrT77AWE_d1CRsm_MW0QPD2M',
		channelUrl: 'https://t.me/SliderQuery',
		channelName: '@SliderQuery',
		timeoutMs: 10000,
		persistUsername: true
	});

	let inFlightEnsurePromise = null;

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

	function normalizeUsername(value) {
		let input = String(value || '').trim();
		if (!input)
			return '';
		return input.startsWith('@') ? input : ('@' + input);
	}

	function validateUsername(value) {
		let normalized = normalizeUsername(value);
		let raw = normalized.startsWith('@') ? normalized.slice(1) : normalized;
		return /^[A-Za-z0-9_]{5,32}$/.test(raw);
	}

	function readSavedUsername() {
		try {
			return normalizeUsername(localStorage.getItem(USERNAME_KEY));
		} catch (e) {
			return '';
		}
	}

	function persistUsername(username, config) {
		if (config.persistUsername === false)
			return;
		try {
			localStorage.setItem(USERNAME_KEY, normalizeUsername(username));
		} catch (e) {
		}
	}

	function clearSavedUsername() {
		try {
			localStorage.removeItem(USERNAME_KEY);
		} catch (e) {
		}
	}

	function isCommercialType(rawType) {
		let normalized = String(rawType || '').trim().toLowerCase();
		return normalized === 'commercial' || normalized === 'paid' || normalized === 'коммерческий';
	}

	function isCommercialPluginConfig(pluginConfig) {
		if (!pluginConfig)
			return false;
		let variation = (pluginConfig.variations && pluginConfig.variations[0]) ? pluginConfig.variations[0] : null;
		let typeValue = variation && variation.store && typeof variation.store.type === 'string'
			? variation.store.type
			: pluginConfig.type;
		return isCommercialType(typeValue);
	}

	async function checkMembership(username, config) {
		let normalized = normalizeUsername(username);
		if (!validateUsername(normalized)) {
			return {
				isMember: false,
				status: 'invalid_username',
				message: 'Введите корректный Telegram username.'
			};
		}

		if (!config.endpoint || !config.apiKey) {
			return {
				isMember: false,
				status: 'config_error',
				message: 'Telegram gate не настроен (endpoint/apiKey).'
			};
		}

		let controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
		let timer = null;
		if (controller && Number.isFinite(config.timeoutMs) && config.timeoutMs > 0) {
			timer = setTimeout(function() {
				controller.abort();
			}, config.timeoutMs);
		}

		try {
			let response = await fetch(config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': config.apiKey
				},
				body: JSON.stringify({ username: normalized }),
				signal: controller ? controller.signal : undefined
			});

			let payload = null;
			try {
				payload = await response.json();
			} catch (e) {
				payload = null;
			}

			if (!response.ok) {
				return {
					isMember: false,
					status: 'api_error',
					message: (payload && (payload.detail || payload.message)) || ('HTTP ' + response.status)
				};
			}

			if (payload && payload.is_member === true) {
				return {
					isMember: true,
					status: String(payload.status || 'member'),
					message: String(payload.message || 'Подписка подтверждена')
				};
			}

			return {
				isMember: false,
				status: String((payload && payload.status) || 'not_member'),
				message: String((payload && payload.message) || 'Подпишитесь на канал и попробуйте снова.')
			};
		} catch (error) {
			if (error && error.name === 'AbortError') {
				return {
					isMember: false,
					status: 'timeout',
					message: 'Превышено время ожидания ответа от сервера.'
				};
			}
			throw error;
		} finally {
			if (timer)
				clearTimeout(timer);
		}
	}

	function ensureModal(config) {
		let overlay = document.getElementById('telegram-gate-overlay');
		if (overlay) {
			let channelName = overlay.querySelector('#telegram-gate-channel-name');
			let channelLink = overlay.querySelector('#telegram-gate-channel-link');
			if (channelName)
				channelName.textContent = config.channelName;
			if (channelLink)
				channelLink.href = config.channelUrl;
			return overlay;
		}

		overlay = document.createElement('div');
		overlay.id = 'telegram-gate-overlay';
		overlay.className = 'telegram-gate-overlay';
		overlay.innerHTML =
			'<div class="telegram-gate-modal" role="dialog" aria-modal="true" aria-labelledby="telegram-gate-title">' +
				'<div class="telegram-gate-header">' +
					'<h3 id="telegram-gate-title" class="telegram-gate-title">Доступ к коммерческому плагину</h3>' +
				'</div>' +
				'<div class="telegram-gate-body">' +
					'<p class="telegram-gate-text">Подтвердите подписку на канал <strong id="telegram-gate-channel-name"></strong>.</p>' +
					'<a id="telegram-gate-channel-link" class="telegram-gate-link" href="#" target="_blank" rel="noopener noreferrer">Открыть канал</a>' +
					'<label class="telegram-gate-label" for="telegram-gate-username">Ваш Telegram username</label>' +
					'<input id="telegram-gate-username" class="telegram-gate-input" type="text" placeholder="@username" autocomplete="off" spellcheck="false" />' +
					'<div id="telegram-gate-status" class="telegram-gate-status" aria-live="polite"></div>' +
				'</div>' +
				'<div class="telegram-gate-footer">' +
					'<button id="telegram-gate-cancel" class="btn-text-default telegram-gate-btn telegram-gate-btn-secondary" type="button">Отмена</button>' +
					'<button id="telegram-gate-check" class="btn-text-default telegram-gate-btn telegram-gate-btn-primary" type="button">Проверить</button>' +
				'</div>' +
			'</div>';

		document.body.appendChild(overlay);
		let link = overlay.querySelector('#telegram-gate-channel-link');
		if (link) {
			link.href = config.channelUrl;
			link.addEventListener('click', function(event) {
				event.preventDefault();
				openExternalUrl(config.channelUrl);
			});
		}
		let name = overlay.querySelector('#telegram-gate-channel-name');
		if (name)
			name.textContent = config.channelName;

		return overlay;
	}

	async function promptAndVerify(config) {
		let overlay = ensureModal(config);
		let usernameInput = overlay.querySelector('#telegram-gate-username');
		let statusNode = overlay.querySelector('#telegram-gate-status');
		let checkButton = overlay.querySelector('#telegram-gate-check');
		let cancelButton = overlay.querySelector('#telegram-gate-cancel');

		if (usernameInput)
			usernameInput.value = readSavedUsername();

		function setStatus(text, mode) {
			if (!statusNode)
				return;
			statusNode.textContent = text || '';
			statusNode.classList.remove('is-error', 'is-success');
			if (mode === 'error')
				statusNode.classList.add('is-error');
			if (mode === 'success')
				statusNode.classList.add('is-success');
		}

		overlay.classList.add('is-visible');
		document.body.classList.add('telegram-gate-lock');
		setStatus('', null);

		return new Promise(function(resolve) {
			let checking = false;

			function cleanup() {
				checkButton.removeEventListener('click', onCheckClick);
				cancelButton.removeEventListener('click', onCancelClick);
				usernameInput.removeEventListener('keydown', onInputKeyDown);
			}

			function hideModal() {
				overlay.classList.remove('is-visible');
				document.body.classList.remove('telegram-gate-lock');
			}

			function setChecking(next) {
				checking = !!next;
				checkButton.disabled = checking;
				cancelButton.disabled = checking;
				usernameInput.disabled = checking;
			}

			function onCancelClick() {
				cleanup();
				hideModal();
				resolve(false);
			}

			function onInputKeyDown(event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					onCheckClick();
				}
			}

			async function onCheckClick() {
				if (checking)
					return;
				let normalized = normalizeUsername(usernameInput.value || '');
				if (!validateUsername(normalized)) {
					setStatus('Введите корректный username (5–32 символа: латиница, цифры, _).', 'error');
					return;
				}
				setChecking(true);
				setStatus('Проверяем подписку...', null);
				let result;
				try {
					result = await checkMembership(normalized, config);
				} catch (error) {
					cleanup();
					hideModal();
					resolve(null);
					return;
				}
				if (result.isMember) {
					persistUsername(normalized, config);
					setStatus('Подписка подтверждена.', 'success');
					cleanup();
					hideModal();
					resolve(true);
					return;
				}
				setChecking(false);
				clearSavedUsername();
				setStatus(result.message || 'Проверка не пройдена.', 'error');
			}

			checkButton.addEventListener('click', onCheckClick);
			cancelButton.addEventListener('click', onCancelClick);
			usernameInput.addEventListener('keydown', onInputKeyDown);
			try {
				usernameInput.focus();
			} catch (e) {
			}
		});
	}

	async function ensureAccess(pluginConfig) {
		if (!isCommercialPluginConfig(pluginConfig) || !DEFAULT_CONFIG.enabled)
			return { allowed: true, reason: 'not-commercial' };

		if (inFlightEnsurePromise)
			return inFlightEnsurePromise;

		inFlightEnsurePromise = (async function() {
			let savedUsername = readSavedUsername();
			if (savedUsername) {
				try {
					let savedResult = await checkMembership(savedUsername, DEFAULT_CONFIG);
					if (savedResult.isMember) {
						persistUsername(savedUsername, DEFAULT_CONFIG);
						return { allowed: true, reason: 'restored', username: savedUsername };
					}
					clearSavedUsername();
				} catch (error) {
					return { allowed: true, reason: 'gate-error' };
				}
			}

			let granted = await promptAndVerify(DEFAULT_CONFIG);
			if (granted === true)
				return { allowed: true, reason: 'verified', username: readSavedUsername() || undefined };
			if (granted === null)
				return { allowed: true, reason: 'gate-error' };
			return { allowed: false, reason: 'denied' };
		})();

		try {
			return await inFlightEnsurePromise;
		} finally {
			inFlightEnsurePromise = null;
		}
	}

	window.TelegramCommercialGate = {
		normalizeUsername,
		validateUsername,
		readSavedUsername,
		checkMembership,
		isCommercialType,
		isCommercialPluginConfig,
		ensureAccess
	};
})();
