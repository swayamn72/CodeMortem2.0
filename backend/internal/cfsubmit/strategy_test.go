package cfsubmit

import (
	"testing"
)

func TestNewStrategy_DefaultIsManual(t *testing.T) {
	s := NewStrategy(false)
	if s.Name() != "manual" {
		t.Errorf("NewStrategy(false).Name() = %q, want %q", s.Name(), "manual")
	}
	outcome, err := s.Submit(SubmitRequest{ContestID: 1, Index: "A", Language: "cpp", Code: "int main(){}"})
	if err != nil {
		t.Errorf("ManualStrategy.Submit returned unexpected error: %v", err)
	}
	if outcome.Handoff != "manual" {
		t.Errorf("ManualStrategy outcome.Handoff = %q, want %q", outcome.Handoff, "manual")
	}
}

func TestNewStrategy_DirectIsExtensionBridge(t *testing.T) {
	s := NewStrategy(true)
	if s.Name() != "extension-bridge" {
		t.Errorf("NewStrategy(true).Name() = %q, want %q", s.Name(), "extension-bridge")
	}
	_, err := s.Submit(SubmitRequest{ContestID: 1, Index: "A", Language: "cpp", Code: "int main(){}"})
	if err == nil {
		t.Error("ExtensionBridgeStrategy.Submit should return an error (not implemented)")
	}
}
