# 三数之和

Jan 23, 2022 • ☕️☕️☕️ 10 min read

### 思路

类似于两数之和，暴力思路都是进行嵌套循环，但是时间复杂度过高，所以本质上就是在嵌套循环的基础上进行优化。首先第一个条件是不能重复，如果查找完再去重会徒增复杂度。不重复的本质其实就是在遍历的时候跳过重复的值，所以我们可以先对数组进行排序，然后遍历时判断与上一个是否重复，重复的话跳过。然后再解决多层嵌套，第一层遍历不可少，但是里面的两次可以进行合并，a + b + c = 0，如果 b1 > b， 那么 a + b1 + c1 = 0 时， c1 一定小于 c，基于这个前提，可以使用双指针来进行第二次遍历。

```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function (nums) {
  let res = []
  const len = nums.length
  // 排序
  const _nums = nums.sort((a, b) => a - b)
  for (let i = 0; i < len; i++) {
    // 如果重复则跳过
    if (_nums[i] === _nums[i - 1]) {
      continue
    }
    let left = i + 1
    let right = len - 1
    // 双指针进行内层遍历
    while (left < right) {
      const target = _nums[i] + _nums[left] + _nums[right]
      // 等于0时将结果存入，然后缩小指针范围，注意跳过重复值
      if (target === 0) {
        res.push([nums[i], nums[left], nums[right]])
        while (left < right && nums[left] === nums[left + 1]) {
          left++
        }
        while (left < right && nums[right] === nums[right - 1]) {
          right--
        }
        left++
        right--
      } else if (target > 0) {
        // 如果大于零，则要左移右指针
        right--
      } else {
        left++
      }
    }
  }
  return res
}
```

> https://leetcode-cn.com/problems/3sum/
