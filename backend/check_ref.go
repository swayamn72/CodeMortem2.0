package main
import (
	"fmt"
	_ "codemortem/internal/challenges/combinatorics"
	"codemortem/internal/challenges"
)
func main() {
	if c, ok := challenges.Get("comb_safe_product"); ok {
		fmt.Println(c.ReferenceCpp)
	} else {
		fmt.Println("Not found")
	}
}
