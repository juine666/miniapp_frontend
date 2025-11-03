package com.stylemirror.miniapp_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 微信支付服务
 * 
 * @author system
 */
@Slf4j
@Service
public class WeChatPayService {
    
    @Value("${wechat.pay.mock-mode:true}")
    private boolean mockMode;
    
    /**
     * 创建JSAPI支付订单
     * 
     * @param orderId 订单ID
     * @param openid 用户openid
     * @return 支付参数
     */
    public Map<String, String> createJsapiOrder(Long orderId, String openid) {
        if (mockMode) {
            log.warn("使用模拟支付模式（mock-mode=true），订单ID: {}, openid: {}", orderId, openid);
            // 返回标记为模拟的支付参数，前端会自动识别并跳过真实支付
            return Map.of(
                    "timeStamp", String.valueOf(System.currentTimeMillis() / 1000),
                    "nonceStr", "mock_" + System.currentTimeMillis(),
                    "package", "prepay_id=mock_" + orderId,
                    "signType", "RSA",
                    "paySign", "mock_sign_" + orderId,
                    "_mockMode", "true"  // 标记为模拟模式
            );
        }
        
        // TODO: 实现真实的微信支付 v3 JSAPI 统一下单
        // 1. 调用微信支付统一下单接口
        // 2. 获取 prepay_id
        // 3. 生成支付签名
        // 4. 返回支付参数
        
        throw new UnsupportedOperationException("真实微信支付功能暂未实现，请设置 wechat.pay.mock-mode=true 使用模拟支付");
    }
}


