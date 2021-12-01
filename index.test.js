const gt = require(".")

test("tests that JS objects can be converted to GT associations", () => {
  const rights = [
    [234, 234],
    ["foo", '"foo"'],
    [true, '"true"'],
    [false, '"false"'],
    [null, '"null"'],
    [undefined, '"undefined"'],
    [[2, 3, 4], '{ "0" -> 2, "1" -> 3, "2" -> 4 }'],
    [{ hello: "world" }, '{ "hello" -> "world" }'],
    [() => {}, '"<function>"'],
  ]

  rights.forEach(pair => {
    expect(gt.object.toAssociation(pair[0])).toBe(pair[1])
  })
})
