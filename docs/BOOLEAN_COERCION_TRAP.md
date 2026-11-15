# JavaScript Boolean Coercion Traps

In JavaScript and Node.js:
```javascript
// TRAP: Any non-empty string is truthy in JavaScript!
Boolean("false") === true
Boolean("0") === true
```
EnvShield flags `ENABLE_FEATURE="false"` when expected type is boolean to prevent unintended production feature activation.
