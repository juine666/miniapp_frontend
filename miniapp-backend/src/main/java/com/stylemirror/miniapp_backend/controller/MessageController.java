package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Message;
import com.stylemirror.miniapp_backend.service.MessageService;
import com.stylemirror.miniapp_backend.service.ProductService;
import com.stylemirror.miniapp_backend.service.UserService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 消息控制器
 * 负责消息相关的API接口
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {
    private final MessageService messageService;
    private final UserService userService;
    private final ProductService productService;
    private final com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper;

    /**
     * 发送消息请求
     */
    public record SendMessageRequest(@NotBlank String content, Long productId, Long toUserId) {}

    /**
     * 发送消息
     * 支持两种方式：
     * 1. 通过 productId（从商品详情页进入，自动获取卖家ID）
     * 2. 通过 toUserId（从会话列表进入，直接指定接收者）
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Message>> sendMessage(
            @RequestBody SendMessageRequest req,
            Authentication auth) {
        Long fromUserId = getUserId(auth);
        Long toUserId = null;
        
        // 优先使用直接指定的 toUserId
        if (req.toUserId() != null) {
            toUserId = req.toUserId();
        } else if (req.productId() != null) {
            // 如果没有指定 toUserId，通过 productId 获取卖家ID
            toUserId = productService.findById(req.productId())
                    .map(p -> p.getSellerId())
                    .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        } else {
            throw new IllegalArgumentException("必须提供商品ID或接收者ID");
        }
        
        log.info("发送消息，发送者ID: {}, 接收者ID: {}, 商品ID: {}", fromUserId, toUserId, req.productId());
        Message message = messageService.sendMessage(fromUserId, toUserId, req.content());
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * 获取与指定用户的聊天记录
     */
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<ApiResponse<List<Message>>> getConversation(
            @PathVariable("userId") Long userId,
            Authentication auth) {
        Long currentUserId = getUserId(auth);
        log.debug("获取聊天记录，用户ID: {}, 对方ID: {}", currentUserId, userId);
        List<Message> messages = messageService.getConversation(currentUserId, userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    /**
     * 获取我的会话列表（支持分页）
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<PageResponse<Message>>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Long userId = getUserId(auth);
        log.debug("获取会话列表，用户ID: {}, 页码: {}, 每页数量: {}", userId, page, size);
        PageResponse<Message> result = messageService.getConversationList(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 标记消息为已读
     */
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable("messageId") Long messageId,
            Authentication auth) {
        Long userId = getUserId(auth);
        messageService.markAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 获取未读消息总数
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Integer>> getUnreadCount(Authentication auth) {
        Long userId = getUserId(auth);
        int count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * 标记与指定用户的所有未读消息为已读
     */
    @PatchMapping("/conversation/{userId}/read")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            @PathVariable("userId") Long userId,
            Authentication auth) {
        Long currentUserId = getUserId(auth);
        messageService.markConversationAsRead(currentUserId, userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 获取当前用户ID（测试模式下支持无认证访问）
     */
    private Long getUserId(Authentication auth) {
        return testAuthHelper.getUserId(auth);
    }
}
