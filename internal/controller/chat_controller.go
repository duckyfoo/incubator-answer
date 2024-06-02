package controller

import (
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
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
	const MARKDOWN_PROMPT = "hello there"
	const NEWLINE = "$NEWLINE$"
	const OPENAI_API_KEY = "<API_KEY>"

	client := openai.NewClient(OPENAI_API_KEY)
	stream, err := client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model: "gpt-3.5-turbo",
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: MARKDOWN_PROMPT},
		},
		Stream: true,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stream.Close()

	ctx.Stream(func(w io.Writer) bool {
		for {
			response, err := stream.Recv()
			if err == io.EOF {
				return false
			}
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return false
			}
			content := strings.ReplaceAll(response.Choices[0].Delta.Content, "\n", NEWLINE)
			ctx.SSEvent("token", content)
		}
	})
}
