export class Stack {
    constructor() {
        this.array = []
        this.size = 0
    }
    push(element){
        this.array.push(element);
        this.size += 1;
    }
    pop(){
        if (this.size == 0) {
            throw "Stack underflow";
        }
        this.size -= 1;
        return this.array.pop();
    }
}

export function uniformRand(low, high) {
    return (high - low) * Math.random() + low;
}