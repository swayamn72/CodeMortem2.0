package codeforces

// CFProblem represents a Codeforces problem from the API.
type CFProblem struct {
	ContestID int      `json:"contestId"`
	Index     string   `json:"index"`
	Name      string   `json:"name"`
	Rating    int      `json:"rating,omitempty"`
	Tags      []string `json:"tags"`
}

// CFProblemStat holds submission statistics for a problem.
type CFProblemStat struct {
	ContestID   int `json:"contestId"`
	Index       string `json:"index"`
	SolvedCount int    `json:"solvedCount"`
}

// CFSubmission represents a Codeforces submission from the user.status API.
type CFSubmission struct {
	ID                  int64     `json:"id"`
	ContestID           int       `json:"contestId"`
	CreationTimeSeconds int64     `json:"creationTimeSeconds"`
	Problem             CFProblem `json:"problem"`
	Verdict             string    `json:"verdict"`
	ProgrammingLanguage string    `json:"programmingLanguage"`
}

// CFProblemsResponse is the response from problemset.problems API.
type CFProblemsResponse struct {
	Status string `json:"status"`
	Result struct {
		Problems          []CFProblem     `json:"problems"`
		ProblemStatistics []CFProblemStat `json:"problemStatistics"`
	} `json:"result"`
}

// CFUserStatusResponse is the response from user.status API.
type CFUserStatusResponse struct {
	Status string         `json:"status"`
	Result []CFSubmission `json:"result"`
}

// ProblemKey uniquely identifies a CF problem.
type ProblemKey struct {
	ContestID int
	Index     string
}

// Key returns the ProblemKey for a CFProblem.
func (p *CFProblem) Key() ProblemKey {
	return ProblemKey{ContestID: p.ContestID, Index: p.Index}
}

// SelectedProblem is a CF problem selected for a match with additional metadata.
type SelectedProblem struct {
	ContestID   int      `json:"contestId"`
	Index       string   `json:"index"`
	Name        string   `json:"name"`
	Rating      int      `json:"rating"`
	Tags        []string `json:"tags"`
	URL         string   `json:"url"`
	SolvedCount int      `json:"solvedCount"`
}
