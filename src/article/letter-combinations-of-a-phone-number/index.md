# 电话号码的字母组合

Jan 23, 2022 • ☕️☕️☕️ 15 min read

### 思路

看到组合的题目，首先想到回溯（https://www.bilibili.com/video/BV1cy4y167mM/）。这道题目本质上就是遍历树，一直遍历到子节点。然后搭配回溯，每次到退出递归的条件，将已经加好的字符串回溯掉。

```js
/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function (digits) {
  if (digits === "") return []
  const _map = new Map([
    ["2", "abc"],
    ["3", "def"],
    ["4", "ghi"],
    ["5", "jkl"],
    ["6", "mno"],
    ["7", "pqrs"],
    ["8", "tuv"],
    ["9", "wxyz"],
  ])
  const len = digits.length
  let combinStr = ""
  let res = []

  function backtrack(index, str) {
    // 退出递归
    if (index >= len) {
      res.push(str)
      return
    }

    const digit = _map.get(digits[index])
    // 递归遍历树
    for (let i = 0; i < digit.length; i++) {
      combinStr += digit[i]
      backtrack(index + 1, combinStr)
      // 一直递归到边界以后一层一层的删掉已经加好的str，回到最初的状态重新进行下一个分支的拼接
      combinStr = combinStr.substring(0, combinStr.length - 1)
    }
  }

  backtrack(0, "")
  return res
};
}
```

> https://leetcode-cn.com/problems/letter-combinations-of-a-phone-number/
