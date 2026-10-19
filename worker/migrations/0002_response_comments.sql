-- Additive table keeps the existing live Worker's response writes compatible
-- while this migration is applied before deploying comment support.
CREATE TABLE response_comments (
 friday TEXT NOT NULL,
 participant_id TEXT NOT NULL,
 comment TEXT NOT NULL DEFAULT '' CHECK(length(comment) <= 500),
 PRIMARY KEY(friday, participant_id),
 FOREIGN KEY(friday, participant_id) REFERENCES responses(friday, participant_id) ON DELETE CASCADE
);
