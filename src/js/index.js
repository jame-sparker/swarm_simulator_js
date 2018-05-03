import {greet} from './greeter.js';
import $ from "jquery";
$(document).ready(() => {
    console.log("I am ready indeed.");
})

console.log("I'm the entry point");
greet();