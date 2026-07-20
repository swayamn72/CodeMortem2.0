package game

// GetUserActiveMatch returns the match ID if the user is currently in an active session.
func (sm *SessionManager) GetUserActiveMatch(userID string) (string, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	for matchID, session := range sm.sessions {
		if session.Player1 != nil && session.Player1.UserID == userID {
			return matchID, true
		}
		if session.Player2 != nil && session.Player2.UserID == userID {
			return matchID, true
		}
	}
	return "", false
}
