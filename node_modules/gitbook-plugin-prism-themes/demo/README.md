# Introduction

This is a demo book.

## build

```bash
gitbook install
gitbook serve

# view http://localhost:4000
```

## demo

### demo 1: typescript

```typescript
class Polygon {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  get area() {
    return this.height * this.width;
  }
}
```

### demo 2: javascript

```javascript
function foo(bar) {
    var a = 42,
        b = "Prism";
    return a + bar(b);
}
```

