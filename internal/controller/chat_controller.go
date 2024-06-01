package controller

import (
	"github.com/apache/incubator-answer/internal/base/handler"
	"github.com/gin-gonic/gin"
)

// ChatController chat controller
type ChatController struct{}

// NewChatController creates a new ChatController
func NewChatController() *ChatController {
	return &ChatController{}
}

// ChatCompletion godoc
// @Summary Get Chat Completion
// @Description Get Chat Completion
// @Tags api-answer
// @Accept  json
// @Produce  json
// @Router /answer/api/v1/chat/completion [get]
// @Success 200 {object} map[string]interface{}
func (cc *ChatController) ChatCompletion(ctx *gin.Context) {
	handler.HandleResponse(ctx, nil, gin.H{
		"data": gin.H{
			"foo": "baz",
		},
	})
}
