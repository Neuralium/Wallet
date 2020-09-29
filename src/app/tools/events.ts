export interface IEventHandler<T> {
    add(delegate: (data?: T) => void): void;
    remove(delegate: (data?: T) => void): void;
}

// simple event handlers for callbacks
export class EventHandler<T> implements IEventHandler<T> {
    private delegates: ((data?: T) => void)[] = [];

    public add(delegate: (data?: T) => void): void {
        this.delegates.push(delegate);
    }

    public remove(delegate: (data?: T) => void): void {
        this.delegates = this.delegates.filter(h => h !== delegate);
    }

    public trigger(data?: T) {
        this.delegates.slice(0).forEach(h => h(data));
    }

    public expose(): IEventHandler<T> {
        return this;
    }
}
