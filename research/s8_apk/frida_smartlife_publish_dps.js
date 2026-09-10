'use strict';

/*
 * Smart Life / Tuya outgoing-DP probe for KaringBee S8 OMNI research.
 *
 * Hooks loaded com.thingclips.* / com.tuya.* implementations whose public
 * method is named publishDps or publishCommands and whose first argument is a
 * String or Map. It is read-only instrumentation: the original call and
 * arguments are forwarded unchanged.
 *
 * Output:
 *   [S8_DP_TX] {"ts":...,"class":...,"method":...,"devIdSuffix":...,"dps":...}
 *
 * Set targetDevIdSuffix to the final characters of the S8 device ID if other
 * Tuya devices are active. Full IDs and account credentials are never printed.
 */

const CONFIG = {
  classPrefixes: ['com.thingclips.', 'com.tuya.'],
  methodNames: ['publishDps', 'publishCommands'],
  targetDevIdSuffix: '',
  includeJavaStack: false,
  deduplicateWindowMs: 600,
  scanDelaysMs: [0, 2500, 8000, 20000, 45000],
};

const hooked = Object.create(null);
const recent = Object.create(null);

function safeString(value) {
  try {
    return value === null || value === undefined ? '' : value.toString();
  } catch (_) {
    return '<toString failed>';
  }
}

function maskDeviceId(value) {
  const text = safeString(value);
  if (!text) return '';
  return text.length <= 6 ? text : text.slice(-6);
}

function classMatches(name) {
  return CONFIG.classPrefixes.some((prefix) => name.indexOf(prefix) === 0);
}

function shouldEmit(devIdSuffix, payload) {
  if (CONFIG.targetDevIdSuffix && devIdSuffix !== CONFIG.targetDevIdSuffix) {
    return false;
  }
  const now = Date.now();
  const key = devIdSuffix + '|' + payload;
  const previous = recent[key] || 0;
  recent[key] = now;
  Object.keys(recent).forEach((item) => {
    if (now - recent[item] > 10000) delete recent[item];
  });
  return now - previous > CONFIG.deduplicateWindowMs;
}

Java.perform(function () {
  let FastJson = null;
  let Log = null;
  let Exception = null;
  try {
    FastJson = Java.use('com.alibaba.fastjson.JSON');
  } catch (_) {}
  try {
    Log = Java.use('android.util.Log');
    Exception = Java.use('java.lang.Exception');
  } catch (_) {}

  function serializeArgument(value, declaredType) {
    if (value === null || value === undefined) return '';
    if (declaredType === 'java.lang.String') return safeString(value);
    try {
      if (FastJson) return safeString(FastJson.toJSONString(value));
    } catch (_) {}
    return safeString(value);
  }

  function readField(instance, fieldName) {
    try {
      let klass = instance.getClass();
      while (klass) {
        try {
          const field = klass.getDeclaredField(fieldName);
          field.setAccessible(true);
          return field.get(instance);
        } catch (_) {
          klass = klass.getSuperclass();
        }
      }
    } catch (_) {}
    return null;
  }

  function getDeviceIdSuffix(instance) {
    const fieldNames = ['mDevId', 'devId', 'mGwId', 'gwId', 'deviceId'];
    for (let i = 0; i < fieldNames.length; i += 1) {
      const value = readField(instance, fieldNames[i]);
      if (value !== null && value !== undefined && safeString(value)) {
        return maskDeviceId(value);
      }
    }
    const getterNames = ['getDevId', 'getDeviceId', 'getGwId'];
    for (let i = 0; i < getterNames.length; i += 1) {
      try {
        const getter = instance[getterNames[i]];
        if (getter) return maskDeviceId(getter.call(instance));
      } catch (_) {}
    }
    return '';
  }

  function stackTrace() {
    if (!CONFIG.includeJavaStack || !Log || !Exception) return undefined;
    try {
      return safeString(Log.getStackTraceString(Exception.$new()));
    } catch (_) {
      return undefined;
    }
  }

  function emit(instance, className, methodName, payload) {
    const devIdSuffix = getDeviceIdSuffix(instance);
    if (!shouldEmit(devIdSuffix, payload)) return;
    const event = {
      ts: new Date().toISOString(),
      class: className,
      method: methodName,
      devIdSuffix: devIdSuffix,
      dps: payload,
    };
    const stack = stackTrace();
    if (stack) event.stack = stack;
    console.log('[S8_DP_TX] ' + JSON.stringify(event));
  }

  function hookMethod(className, wrapper, methodName) {
    let dispatcher;
    try {
      dispatcher = wrapper[methodName];
    } catch (_) {
      return 0;
    }
    if (!dispatcher || !dispatcher.overloads) return 0;

    let count = 0;
    dispatcher.overloads.forEach(function (overload, index) {
      const argumentTypes = overload.argumentTypes || [];
      if (!argumentTypes.length) return;
      const firstType = argumentTypes[0].className || safeString(argumentTypes[0]);
      if (firstType !== 'java.lang.String' && firstType.indexOf('java.util.') !== 0) {
        return;
      }
      const signature = className + '::' + methodName + '#' + index + '(' +
        argumentTypes.map((item) => item.className || safeString(item)).join(',') + ')';
      if (hooked[signature]) return;

      overload.implementation = function () {
        const args = Array.prototype.slice.call(arguments);
        const payload = serializeArgument(args[0], firstType);
        emit(this, className, methodName, payload);
        return overload.apply(this, args);
      };
      hooked[signature] = true;
      count += 1;
    });
    return count;
  }

  function scan() {
    let installed = 0;
    let classes = [];
    try {
      classes = Java.enumerateLoadedClassesSync();
    } catch (error) {
      console.log('[S8_DP_PROBE] class enumeration failed: ' + safeString(error));
      return;
    }

    classes.forEach(function (className) {
      if (!classMatches(className)) return;
      let wrapper;
      try {
        wrapper = Java.use(className);
      } catch (_) {
        return;
      }
      CONFIG.methodNames.forEach(function (methodName) {
        try {
          installed += hookMethod(className, wrapper, methodName);
        } catch (_) {}
      });
    });
    console.log('[S8_DP_PROBE] scan complete; new hooks=' + installed +
      '; total=' + Object.keys(hooked).length);
  }

  CONFIG.scanDelaysMs.forEach(function (delay) {
    setTimeout(scan, delay);
  });
  console.log('[S8_DP_PROBE] installed; open the S8 panel and perform one action at a time');
});
