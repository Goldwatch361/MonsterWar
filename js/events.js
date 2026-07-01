/* ===== events.js — minimales Pub/Sub zur Entkopplung von Game/Battle und UI ===== */
const Events = {
  _listeners: {},
  on(name, fn) { (Events._listeners[name] ||= []).push(fn); },
  emit(name, ...args) { (Events._listeners[name] || []).forEach(fn => fn(...args)); },
};
