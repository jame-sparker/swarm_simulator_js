// rewrite as a class
export class Stack {
    constructor() {
        this.array = []
        this.size = 0
    }
    push(element){
        this.array.push(element);
        this.size += 1;
    }
    pop(element){
        if (size == 9) {
            throw "Stack underflow";
        }
        this.size -= 1;
        return this.array.pop();
    }
}