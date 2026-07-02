package main

import (
	"codemortem/internal/challenges"
	_ "codemortem/internal/challenges/combinatorics"
	"fmt"
)

func main() {
	fmt.Println("Registered challenges:")
	for k := range challenges.All() {
		fmt.Println(k)
	}
}
