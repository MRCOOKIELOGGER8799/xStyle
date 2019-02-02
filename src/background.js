import browser from 'webextension-polyfill';
import storage from './core/storage';
import styles from './core/styles';
import notify from './core/notify';

window.IS_BACKGROUND = true;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.method === 'notifyBackground') {
		request.method = request.reason;
	}
	switch (request.method) {
		case "healthCheck":
			return new Promise(resolve => {
				storage.getDatabase().then(() => {
					resolve(true);
				}).catch(() => {
					resolve(false);
				});
			})
		case "openURL":
			return openURL(request);
		case "getStyles":
			// check if this is a main content frame style enumeration
			return new Promise(resolve => {
				styles.get(request).then(style => {
					if (request.matchUrl && !request.id && sender && sender.tab && sender.frameId == 0 && sender.tab.url == request.matchUrl) {
						notify.updateIcon(sender.tab, styles);
					}
					resolve(style);
				});
			});
		case "saveStyle":
			return styles.save(request);
		case "installStyle":
			return styles.install(request);
		case "invalidateCache":
			styles.invalidateCache();
			break;
		case "getPrefs":
			if (typeof(request.name) === 'string') {
				sendResponse(prefs.get(request.name));
			} else {
				sendResponse(request.name.map(n => storage.prefs.get(n)));
			}
			return;
	}
	sendResponse(); // avoid error
});

storage.prefs.watch('disableAll', (to) => {
	browser.contextMenus.update("disableAll", {
		checked: to
	});
});
storage.prefs.watch('show-badge', (to) => {
	browser.contextMenus.update("show-badge", {
		checked: to
	});
});
storage.prefs.watch('auto-update', (to) => {
	toggleAutoUpdate(to);
});
storage.prefs.watch('modify-csp', (to) => {
	toggleCSP(to);
});