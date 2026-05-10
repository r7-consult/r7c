/*
 * Optional enterprise runtime configuration.
 *
 * Leave this file as-is for the public catalog. In a corporate build, replace
 * the object below or set the same values through URL query parameters.
 */
(function(window) {
	window.R7C_ENTERPRISE_CONFIG = window.R7C_ENTERPRISE_CONFIG || {
		catalogBaseUrl: 'http://127.0.0.1:8090/',
		managerUpdateBaseUrl: 'http://127.0.0.1:8089/',
		repositoryUrl: 'http://127.0.0.1:8090/',
		connectivityCheckUrl: 'http://127.0.0.1:8090/health',
		enableRatings: false
	};
})(window);
