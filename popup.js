var DOMAIN, host, last_selected_host, last_selected_visible;

window.addEventListener('load', function () {
    loadFont();
    renderI18n();
    var inputbox = document.getElementById('text');
    var ai_error = document.getElementById('ai_error');
    var setting_error = document.getElementById('setting_error');
    var send_error = document.getElementById('send_error');
    host = document.getElementById('hosts');

    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        var name, url;
        var tab = tabs[0];

        name = tab.title;
        url = tab.url;

        inputbox.innerHTML = name + '\n' + url;
    });

    var add_instance_button = document.getElementById('add_instance_button');
    add_instance_button.addEventListener('click', function () {
        setHeaderButton(false, true, false);
        display_view('add_instance');
    });

    var setting_btn = document.getElementById('setting_button');
    setting_btn.addEventListener('click', function () {
        chrome.storage.local.get('host_' + host.value, result => {
            var cfg = parseConfig(result['host_' + host.value]);
            document.getElementById('setting_api_key').value = cfg.api_key;
            document.getElementById('setting_hostname').value = cfg.host;
            setHeaderButton(false, true, false);
            display_view('setting');
        });
    });

    var setting_delete_button = document.getElementById('setting_delete_button');
    setting_delete_button.addEventListener('click', function () {
        chrome.storage.local.remove('host_' + host.value, () => {
            window.location.reload();
        });
    });

    var setting_btn = document.getElementById('back_button');
    setting_btn.addEventListener('click', function () {
        setHeaderButton(true, false, true);
        display_view('main');
    });

    var setting_save_button = document.getElementById('setting_save_button');
    setting_save_button.addEventListener('click', function () {
        var api_key = document.getElementById('setting_api_key').value;
        var input_host = document.getElementById('setting_hostname').value;

        setting_save_button.disabled = true;

        chrome.runtime.sendMessage({
            opType: 'checkToken',
            api_key: api_key,
            host: input_host
        }, function (result) {
            setting_error.innerHTML = '';
            
            if (!result.success) {
                if (result.error) {
                    setting_error.innerHTML = chrome.i18n.getMessage('msg_setting_validation_error') + ': ' + result.error.message;
                }else{
                    setting_error.innerHTML = chrome.i18n.getMessage('msg_setting_validation_error') + ': Unknown Error';
                }
                setting_save_button.disabled = false;
            }else{
                obj = Object();
                obj['host_' + input_host] = stringifyConfig({
                    api_key: api_key,
                    host: input_host
                });
                chrome.storage.local.set(obj, () => {
                    window.location.reload();
                });

            }
        });
    });

    var ai_add_button = document.getElementById('ai_add_button');
    ai_add_button.addEventListener('click', function () {
        var api_key = document.getElementById('ai_api_key').value;
        var input_host = document.getElementById('ai_hostname').value;

        ai_add_button.disabled = true;

        chrome.runtime.sendMessage({
            opType: 'checkToken',
            api_key: api_key,
            host: input_host
        }, function (result) {
            ai_error.innerHTML = '';
            
            if (!result.success) {
                if (result.error) {
                    ai_error.innerHTML = chrome.i18n.getMessage('msg_setting_validation_error') + ': ' + result.error.message;
                }else{
                    ai_error.innerHTML = chrome.i18n.getMessage('msg_setting_validation_error') + ': Unknown Error';
                }
                ai_add_button.disabled = false;
            }else{
                obj = Object();
                obj['host_' + input_host] = stringifyConfig({
                    api_key: api_key,
                    host: input_host
                });
                chrome.storage.local.set(obj, () => {
                    /*ai_add_button.disabled = false;
                    setHeaderButton(true, false, true);
                    display_view('main');*/
                    window.location.reload();
                });

            }
        });
    });

    var send_note_button = document.getElementById('send_note_button');
    send_note_button.addEventListener('click', function () {
        chrome.storage.local.get('host_' + host.value, result => {
            var cfg = parseConfig(result['host_' + host.value]);
            if (!cfg.api_key || !cfg.host) {
                send_error.innerHTML = chrome.i18n.getMessage('msg_setting_not_set');
                return;
            }
            var text = document.getElementById('text').value;
            var input_visible = document.getElementById('note_visible');

            send_note_button.disabled = true;
            
            chrome.runtime.sendMessage({
                opType: 'sendNote',
                api_key: cfg.api_key,
                host: cfg.host,
                text: text,
                visible: input_visible.value
            }, function (result) {
                send_error.innerHTML = '';

                if (!result.success) {
                    if (result.error) {
                        send_error.innerHTML = chrome.i18n.getMessage('msg_send_note_error') + ': ' + result.error.message;
                    }else{
                        send_error.innerHTML = chrome.i18n.getMessage('msg_send_note_error') + ': Unknown Error';
                    }
                    send_note_button.disabled = false;
                }else{
                    obj = Object();
                    obj['_config_last_selected_host'] = cfg.host;
                    obj['_config_last_selected_visible'] = input_visible.value;
                    cfg.visible = input_visible.value;
                    obj['host_' + cfg.host] = stringifyConfig(cfg)
                    chrome.storage.local.set(obj, () => {
                        window.close();
                    });
                }

            });
        });
    });
    
    hosts.onchange = function () {
        chrome.storage.local.get('host_' + hosts.value, result => {
            var cfg = parseConfig(result['host_' + hosts.value]);
            var nv_options = document.querySelectorAll('.opt_nv');
            for (var i=0; i<nv_options.length; i++) {
                nv_options[i].selected = false;
            }
            if (cfg.visible) document.getElementById('nv_' + cfg.visible).selected = true;
        });
    }

    // checkConfig();

    chrome.storage.local.get(['_config_last_selected_host', '_config_last_selected_visible'], result => {
        if (result._config_last_selected_host) last_selected_host = result._config_last_selected_host;
        if (result._config_last_selected_visible) last_selected_visible = result._config_last_selected_visible;
    });

    readConfig();
});

function loadFont() {
    var style = document.createElement('style');
    var fontpath = chrome.runtime.getURL('fonts/notosans.otf');
    style.textContent = '@font-face { font-family: "NotoSansExtFont"; src: url("' + fontpath + '"); }';
    document.head.appendChild(style);
}

function readConfig() {
    var hostCount = 0;
    host.innerHTML = '';
    chrome.storage.local.get(null, result => {
        for (var [k, v] of Object.entries(result)) {
            if (k.startsWith('host_')) {
                var option = document.createElement('option');
                option.value = k.substring(5);
                option.innerHTML = k.substring(5);
                if (k.substring(5) === last_selected_host) {
                    option.selected = true;
                    if (last_selected_visible || result[k].visible) document.getElementById('nv_' + (last_selected_visible || result[k].visible)).selected = true;
                }
                host.appendChild(option);
                hostCount++;
            }
        }
        if (hostCount == 0) {
            setHeaderButton(false, false, false);
            display_view('add_instance');
        }else{
            setHeaderButton(true, false, true);
            display_view('main');
        }
    });
}

function checkConfig() {
    chrome.storage.local.get(DOMAIN, result => {
        var cfg = parseConfig(result[DOMAIN]);
        if (!cfg.api_key || !cfg.host) {
            setHeaderButton(false, false, false);
            document.getElementById('setting_note').innerHTML = chrome.i18n.getMessage('msg_firstrun');
            display_view('setting');
        }else{
            setHeaderButton(true, false, true);
            display_view('main');
        }
    });
}

function parseConfig(j) {
    if (j == undefined || j == null) {
        return {};
    }
    return JSON.parse(j);
}

function stringifyConfig(d) {
    return JSON.stringify(d);
}

function display_view(name) {
    var elements = document.querySelectorAll('*[data-role="view"]');
    elements.forEach(element => {
        element.style.display = 'none';
    });
    document.getElementById('view_' + name).style.display = 'block';
}

function renderI18n() {
    var elements = document.querySelectorAll('*[data-role="i18n"]');
    elements.forEach(element => {
        try {
            if (element.dataset.i18nattr) {
                element[element.dataset.i18nattr] = chrome.i18n.getMessage(element.dataset.i18nkey);
            }else{
                element.innerHTML = chrome.i18n.getMessage(element.dataset.i18nkey);
            }
        }catch(e){
            element.innerHTML = '## INVALID TRANSLATE KEY ##';
        }
    });
}

function setHeaderButton(p1, p2, p3) {
    //document.getElementById('setting_button').style.display = p1 ? 'block' : 'none';
    document.getElementById('back_button').style.display = p2 ? 'block' : 'none';
    //document.getElementById('add_instance_button').style.display = p3 ? 'block' : 'none';
}

function checkValidInstance(hostname, callback) {
    chrome.runtime.sendMessage({
        opType: 'checkValidInstance',
        host: hostname
    }, callback);
}