// 이벤트 로그 존재 여부 확인

const assert = require('chai').assert;

const inLogs = async (logs, eventName) => {
    const event = logs.find(e => e.event === eventName);
    assert.exists(event);
}

module.exports = {
    inLogs
}