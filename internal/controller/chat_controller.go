package controller

import (
	"os"
	"strings"

	"github.com/apache/incubator-answer/internal/base/handler"
	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"github.com/segmentfault/pacman/errors"
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
// @Param prompt query string true "Prompt for the chat completion"
// @Router /answer/api/v1/chat/completion [get]
// @Success 200 {object} map[string]interface{}
func (cc *ChatController) ChatCompletion(ctx *gin.Context) {
	prompt := ctx.Query("prompt")
	if prompt == "" {
		handler.HandleResponse(ctx, gin.Error{Err: errors.New(400, "prompt is required")}, nil)
		return
	}

	OPENAI_API_KEY := os.Getenv("OPENAI_API_KEY")

	client := openai.NewClient(OPENAI_API_KEY)
	stream, err := client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model: "gpt-4",
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		handler.HandleResponse(ctx, err, nil)
		return
	}
	defer stream.Close()

	ctx.Writer.Header().Set("Content-Type", "text/event-stream")
	ctx.Writer.Header().Set("Cache-Control", "no-cache")
	ctx.Writer.Header().Set("Connection", "keep-alive")

	const NEWLINE = "$NEWLINE$"

	for {
		select {
		case <-ctx.Done():
			return
		default:
			response, err := stream.Recv()
			if err != nil {
				handler.HandleResponse(ctx, err, nil)
				return
			}
			if response.Choices[0].Delta.Content != "" {
				contentWithNewlines := strings.ReplaceAll(response.Choices[0].Delta.Content, "\n", NEWLINE)
				ctx.Writer.Write([]byte("event: token\n"))
				ctx.Writer.Write([]byte("data: " + contentWithNewlines + "\n\n"))
				ctx.Writer.Flush()
			}
		}
	}
}
