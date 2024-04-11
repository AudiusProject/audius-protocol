class InMemoryStorage {
    private storage: Record<string, string>;

    constructor() {
        this.storage = {};
    }

    getItem(key: string): string | null {
        return this.storage.hasOwnProperty(key) ? this.storage[key] : null;
    }

    setItem(key: string, value: string): void {
        this.storage[key] = value;
    }

    removeItem(key: string): void {
        delete this.storage[key];
    }

    clear(): void {
        this.storage = {};
    }

    key(index: number): string | null {
        const keys = Object.keys(this.storage);
        return index >= 0 && index < keys.length ? keys[index] : null;
    }

    // Optional: For compatibility with LocalStorage, you might want to implement length as a getter.
    get length(): number {
        return Object.keys(this.storage).length;
    }
}
