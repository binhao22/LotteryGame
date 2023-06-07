// revert 에러를 존재 여부 확인

module.exports = async (promise) => {
    try {
        await promise;
        assert.fail('Expected revert not received');
    } catch (error) {
        const revertFound = error.message.search('revert' >= 0);
        assert(revertFound, `Expected "revert", got ${error} instead`);
    }
}