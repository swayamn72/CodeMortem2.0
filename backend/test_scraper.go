package main

import (
	"fmt"
	"log"
	"codemortem/internal/codeforces"
)

func main() {
	client := codeforces.NewClient()
	stmt, inFmt, outFmt, constr, _, err := client.FetchProblemStatement(1197, "B")
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	fmt.Printf("Statement length: %d\n", len(stmt))
	fmt.Printf("InputFormat length: %d\n", len(inFmt))
	fmt.Printf("OutputFormat length: %d\n", len(outFmt))
	fmt.Printf("Constraints length: %d\n", len(constr))
	if len(stmt) == 0 {
		fmt.Println("STATEMENT IS EMPTY!")
	}
}
