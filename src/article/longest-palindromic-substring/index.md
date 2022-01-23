# 最长回文子串

Jan 23, 2022 • ☕️☕️☕️ 10 min read

### 思路

选取一个中心字符，向两边扩散，一直扩散到不是回文串位置，依次向后遍历，直到遍历完整个字符串。不过中心字符有可能是一个，也有可能是多个。例如 abbbbbba，中心为 bbbbbb，所以在寻找中心时要先分向左右扩散，一直到字符不一样为止。

```js
/**
 * @param {string} s
 * @return {string}
 */

// 中心扩散法
var longestPalindrome = function (s) {
  let strLeft = 0
  let strRight = 0
  let maxLen = 1
  let i = 0
  const len = s.length
  while (i < len) {
    // 以下两个循环是为了找到所有重复的中心子串
    let left = i - 1
    while (left >= 0 && s[left] === s[i]) {
      left--
    }
    let right = i + 1
    while (right < len && s[right] === s[i]) {
      right++
    }
    // 记录右侧的位置，下次将该位置作为中心点，如果出现中心子串是多个重复的，则可以跳过那些重复的，避免无效循环
    const end = right
    // 向变扩散，寻找当前中心的最长子串
    while (left >= 0 && right < len && s[left] === s[right]) {
      left--
      right++
    }
    if (maxLen < right - left + 1) {
      strLeft = left + 1
      strRight = right - 1
      maxLen = right - left + 1
    }

    i = end
  }
  return s.substring(strLeft, strRight + 1)
}
```

> https://leetcode-cn.com/problems/longest-palindromic-substring/
