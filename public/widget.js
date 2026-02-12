(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var botId = script.getAttribute('data-bot-id');
  if (!botId) {
    console.error('SmartChat: data-bot-id attribute is required');
    return;
  }

  var themeColor = script.getAttribute('data-theme-color') || '#3B82F6';
  var origin = script.src.replace(/\/widget\.js.*$/, '');

  // Create shadow host
  var host = document.createElement('div');
  host.id = 'smartchat-widget';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });

  // Styles
  var style = document.createElement('style');
  style.textContent = [
    ':host { all: initial; }',
    '.sc-container { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    '.sc-btn { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s; }',
    '.sc-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }',
    '.sc-btn svg { width: 26px; height: 26px; fill: white; transition: transform 0.3s; }',
    '.sc-btn.open svg.chat-icon { transform: scale(0) rotate(90deg); position: absolute; }',
    '.sc-btn.open svg.close-icon { transform: scale(1) rotate(0deg); }',
    '.sc-btn:not(.open) svg.chat-icon { transform: scale(1) rotate(0deg); }',
    '.sc-btn:not(.open) svg.close-icon { transform: scale(0) rotate(-90deg); position: absolute; }',
    '.sc-frame-wrap { position: fixed; bottom: 88px; right: 20px; width: 400px; height: 600px; z-index: 99999; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.16); opacity: 0; transform: translateY(16px) scale(0.95); transition: opacity 0.25s ease, transform 0.25s ease; pointer-events: none; }',
    '.sc-frame-wrap.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }',
    '.sc-frame { width: 100%; height: 100%; border: none; background: white; }',
    '@media (max-width: 767px) {',
    '  .sc-frame-wrap { top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; border-radius: 0; }',
    '  .sc-container { bottom: 16px; right: 16px; }',
    '}',
  ].join('\n');
  shadow.appendChild(style);

  // Container
  var container = document.createElement('div');
  container.className = 'sc-container';
  shadow.appendChild(container);

  // Iframe wrapper
  var frameWrap = document.createElement('div');
  frameWrap.className = 'sc-frame-wrap';
  container.appendChild(frameWrap);

  // Iframe
  var iframe = document.createElement('iframe');
  iframe.className = 'sc-frame';
  iframe.title = 'SmartChat';
  iframe.allow = 'clipboard-write';
  // Lazy load: set src only on first open
  frameWrap.appendChild(iframe);

  // Toggle button
  var btn = document.createElement('button');
  btn.className = 'sc-btn';
  btn.style.backgroundColor = themeColor;
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = [
    '<svg class="chat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
    '  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>',
    '  <path d="M7 9h10v2H7zm0-3h10v2H7z"/>',
    '</svg>',
    '<svg class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
    '  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
    '</svg>',
  ].join('');
  container.appendChild(btn);

  var isOpen = false;
  var loaded = false;

  btn.addEventListener('click', function () {
    isOpen = !isOpen;

    if (isOpen) {
      if (!loaded) {
        iframe.src = origin + '/chat/' + botId;
        loaded = true;
      }
      frameWrap.classList.add('visible');
      btn.classList.add('open');
      btn.setAttribute('aria-label', 'Close chat');
    } else {
      frameWrap.classList.remove('visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-label', 'Open chat');
    }
  });
})();
