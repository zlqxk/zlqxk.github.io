# 盛最多水的容器

Jan 23, 2022 • ☕️☕️☕️ 10 min read

### 思路

采用双指针，默认双指针指向数组两端，然后将数值小的那一端向另一端移动，直到两个指针相遇。

### 为什么

假设当前两个指针的坐标是 x 和 y，并且 arr[y] >= arr[x]，所以无论怎样移动 y（只能向靠近另一端移动），那么面积一定小于 arr[x] \* arr[y]，因为上界是由 arr[x]决定的，所以只能移动 x 来尝试打破这个局面，当移动了 x 以后，我们就又回到了一开始的场景。

```js
/**
 * @param {number[]} height
 * @return {number}
 */

// 双指针
var maxArea = function (height) {
  let left = 0
  let right = height.length - 1
  let max = 0
  while (left != right) {
    max = Math.max(max, Math.min(height[left], height[right]) * (right - left))
    if (height[left] >= height[right]) {
      right--
    } else {
      left++
    }
  }
  return max
}
```

> https://leetcode-cn.com/problems/container-with-most-water/
