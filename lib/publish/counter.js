function createCounter() {
    let current = 0;
    const counter = {
        get current() { return current; },
        increment() { current++; },
    };
    return counter;
}

module.exports = {
    createCounter,
};
