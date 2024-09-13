const args = process.argv.slice(2);
const serverType = args[0];

switch (serverType) {
  case "callbacks":
    require("./server/server-callbacks");
    break;
  case "async":
    require("./server/server-async");
    break;
  case "promises":
    require("./server/server-promises");
    break;
  case "rxjs":
    require("./server/server-rxjs");
    break;
  default:
    console.log(
      "Please specify a valid server type: callbacks, async, promises, or rxjs."
    );
    console.log("Example usage: node src/index.js callbacks");
    process.exit(1);
}

console.log("Starting server with type:", serverType);
