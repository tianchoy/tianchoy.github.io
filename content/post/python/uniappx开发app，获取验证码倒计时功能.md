---
title: "uniappx开发app，获取验证码倒计时功能"
date: 2025-07-08T22:07:07+08:00
categories: ["python"]
draft: false
---

使用uniappx+uts+firstui开发app，实现一个获取手机验证码功能，记录一下代码：
```vue
<template>
	<view class="container">
		<view class="content">
			<fui-input placeholder="请输入手机号">
				<template v-slot:left>
					<view class="fui-left__icon">
						<image class="icon" src="@/static/phone.png"></image>
					</view>
				</template>
			</fui-input>
			<fui-input padding="20rpx 32rpx" placeholder="请输入验证码" :bottomLeft="0">
				<template v-slot:left>
					<view class="fui-left__icon">
						<image class="icon" src="@/static/captcha.png"></image>
					</view>
				</template>
				<fui-button 
					type="gray" 
					:bold="true" 
					width="200rpx" 
					height="64rpx" 
					:size="28" 
					@click="getPsw" 
					:text="btnWord"
					:disabled="isCounting"
				></fui-button>
			</fui-input>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { ref } from 'vue'
	
	const btnWord = ref('获取验证码')
	const isCounting = ref(false)
	
	// 使用函数声明提升特性
	function countDown(seconds: number) {
		if (seconds <= 0) {
			btnWord.value = '获取验证码'
			isCounting.value = false
			return
		}
		
		btnWord.value = `${seconds}秒后重发`
		
		// 使用递归调用实现倒计时
		setTimeout(() => {
			countDown(seconds - 1)
		}, 1000)
	}
	
	const getPsw = () => {
		if (isCounting.value) return
		
		console.log('发送验证码请求...')
		isCounting.value = true
		
		// 开始倒计时
		countDown(60)
	}
</script>

<style lang="scss" scoped>
	.container {
		height: 100%;
		background: #f3f3f3;
		padding: 0 20rpx;

		.content {
			background-color: #fff;
			padding: 30rpx;
			border-radius: 10rpx;
			.icon{
				width:40rpx;
				height:40rpx;
				margin-right: 10rpx;
			}
		}
	}
</style>
```