export default class Counter {
    private _current = 0;

    get current() {
        return this._current;
    }

    increment() {
        this._current++;
    }
}
