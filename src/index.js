const STATES = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  rejected: 'rejected',
};

class CustomPromise {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('Executor must be a function');
    }

    this.PromiseState = STATES.pending;
    this.PromiseFulfillReactions = [];
    this.PromiseRejectReactions = [];
    this.promiseResult = null;

    try {
      executor(this.resolve, this.reject);
    } catch (err) {
      this.reject(err);
    }
  }

  static resolve = value => new CustomPromise(resolve => resolve(value));

  static reject = value => new CustomPromise((_, reject) => reject(value))

  isThenable = value => Boolean(value && typeof value.then === 'function');

  reject = (error) => {
    if (this.PromiseState !== STATES.pending) {
      return;
    }
    this.PromiseState = STATES.rejected;
    this.promiseResult = error;
    this.PromiseRejectReactions.forEach(onRejected => onRejected(error));
  };

  resolve = (result) => {
    if (this.PromiseState !== STATES.pending) {
      return;
    }

    if (this.isThenable(result)) {
      result.then(this.resolve, this.reject);
      return;
    }

    this.PromiseState = STATES.fulfilled;
    this.promiseResult = result;
    this.PromiseFulfillReactions.forEach(onFullfiled => onFullfiled(result));
  };

  then = (onFullfiled, onRejected) => new CustomPromise((resolve, reject) => {
    let onFullfiledHandler = onFullfiled;
    let onRejectedHandler = onRejected;
    if (typeof onFullfiledHandler !== 'function') {
      onFullfiledHandler = arg => arg;
    }
    if (typeof onRejectedHandler !== 'function') {
      onRejectedHandler = (arg) => { throw arg; };
    }

    const onFulfilledReaction = (result) => {
      try {
        resolve(onFullfiledHandler(result));
      } catch (e) {
        reject(e);
      }
    };

    const onRejectedReaction = (error) => {
      try {
        resolve(onRejectedHandler(error));
      } catch (e) {
        reject(e);
      }
    };

    if (this.PromiseState === STATES.fulfilled) {
      setTimeout(() => onFulfilledReaction(this.promiseResult), 0);
      return;
    }

    if (this.PromiseState === STATES.rejected) {
      setTimeout(() => onRejectedReaction(this.promiseResult), 0);
      return;
    }

    this.PromiseFulfillReactions.push(onFulfilledReaction);
    this.PromiseRejectReactions.push(onRejectedReaction);
  });

  catch = onRejected => this.then(null, onRejected);
}

export default CustomPromise;
