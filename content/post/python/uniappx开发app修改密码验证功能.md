---
title: "uniappx开发app修改密码验证功能"
date: 2025-07-08T22:07:07+08:00
categories: ["python"]
draft: false
---



1. **实时验证**：
   - 新密码输入时立即验证格式
   - 确认密码输入时验证格式和一致性
   - 所有输入变化时更新按钮状态

2. **错误提示**：
   - 添加了错误信息区域，实时显示验证结果
   - 提供明确的格式错误和密码不一致提示

3. **按钮状态逻辑优化**：
   - 要求所有字段非空
   - 新密码必须符合格式
   - 确认密码必须与新密码匹配

4. **密码规则增强**：
   - 使用更严格的正则确保包含两类及以上字符
   - 明确排除空格等无效字符


```html
<template>
	<view class="container">
		<view class="content">
			<fui-input label="旧密码" placeholder="请输入原密码" :modelValue="oldPassword"
				@input="updateOldPassword"></fui-input>
			<fui-input label="新密码" placeholder="请输入新密码" :modelValue="newPassword"
				@input="updateNewPassword"></fui-input>
			<fui-input label="确认新密码" placeholder="再次输入新密码" :modelValue="confirmPassword"
				@input="updateConfirmPassword"></fui-input>
		</view>
		<view class="tips">
			<text class="tips-word">密码8-16位,需包含英文字母、数字、特殊字符中两类及以上</text>
		</view>
		<!-- 添加错误提示 -->
		<view v-if="errorMsg" class="error-msg">
			<text>{{errorMsg}}</text>
		</view>
		<view>
			<fui-button color="#fff" :disabled="btnDisabled" text="提交" background="#1296db" height="80rpx"
				@onclick="submit"></fui-button>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { ref } from 'vue'

	const oldPassword = ref<string>('')
	const newPassword = ref<string>('')
	const confirmPassword = ref<string>('')
	const btnDisabled = ref<boolean>(true)
	const errorMsg = ref<string>('') // 错误提示信息
	
	// 增强密码规则：必须包含两类及以上字符
	const passwordReg = /^(?:(?=.*[a-zA-Z])(?=.*\d)|(?=.*[a-zA-Z])(?=.*[^a-zA-Z\d])|(?=.*\d)(?=.*[^a-zA-Z\d])).{8,16}$/

	// 验证密码格式
	function verPassword(psw : string) : boolean {
		return passwordReg.test(psw)
	}
	
	// 更新按钮状态
	const updateBtnState = () => {
		// 所有字段非空 + 新密码格式正确 + 确认密码匹配
		const allFieldsFilled = oldPassword.value.length > 0 && 
		                      newPassword.value.length > 0 && 
		                      confirmPassword.value.length > 0
		
		const passwordsMatch = newPassword.value === confirmPassword.value
		const newPwdValid = verPassword(newPassword.value)
		
		btnDisabled.value = !(allFieldsFilled && newPwdValid && passwordsMatch)
	}

	// 更新旧密码
	const updateOldPassword = (e : string) => {
		oldPassword.value = e
		updateBtnState()
	}

	// 更新新密码
	const updateNewPassword = (e : string) => {
		newPassword.value = e
		errorMsg.value = '' // 清除错误提示
		
		if (e.length > 0 && !verPassword(e)) {
			errorMsg.value = '密码格式不符合要求'
		} else if (confirmPassword.value.length > 0 && e !== confirmPassword.value) {
			errorMsg.value = '两次输入的密码不一致'
		}
		
		updateBtnState()
	}

	// 更新确认密码
	const updateConfirmPassword = (e : string) => {
		confirmPassword.value = e
		errorMsg.value = '' // 清除错误提示
		
		if (e.length > 0) {
			if (!verPassword(e)) {
				errorMsg.value = '确认密码格式不符合要求'
			} else if (e !== newPassword.value) {
				errorMsg.value = '两次输入的密码不一致'
			}
		}
		
		updateBtnState()
	}

	// 提交表单
	const submit = () => {
		// 最终验证
		if (!verPassword(newPassword.value)) {
			uni.showToast({
				title: '密码格式错误',
				icon: 'none'
			})
			return
		}
		if (newPassword.value !== confirmPassword.value) {
			uni.showToast({
				title: '两次密码不一致',
				icon: 'none'
			})
			return
		}
		uni.showToast({
			title: '提交成功',
			icon: 'none'
		})
	}
</script>

<style lang="scss">
	.container {
		height: 100%;
		background-color: #f5f5f5;
		padding: 50rpx 20rpx;

		.fui-input__label-size {
			font-size: 26rpx !important;
		}

		.content {
			background-color: #fff;
			border-radius: 20rpx;
			padding: 20rpx;
		}

		.tips {
			margin: 40rpx 0;

			.tips-word {
				font-size: 30rpx;
				color: #999;
			}
		}
		
		.error-msg {
			margin: 20rpx 0;
			text {
				color: #e64340;
				font-size: 26rpx;
			}
		}
	}
</style>
```

