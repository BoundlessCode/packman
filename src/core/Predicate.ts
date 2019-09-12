export default interface Predicate<T> {
  (value: T): boolean;
}
