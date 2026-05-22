-- Insert a dummy question
INSERT INTO questions (id, title, slug, statement, input_format, output_format, constraints, examples, difficulty, tags, generated_by)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'A+B Problem',
    'a-plus-b-problem',
    'Given two integers $A$ and $B$, output their sum.',
    'A single line containing two integers $A$ and $B$.',
    'A single integer, the sum of $A$ and $B$.',
    '-10^9 <= A, B <= 10^9',
    '[{"input": "1 2\n", "output": "3\n"}]',
    800,
    '{"math"}',
    'system'
) ON CONFLICT DO NOTHING;

-- Insert a dummy test case
INSERT INTO test_cases (question_id, input, expected_output, is_sample, ordinal)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '1 2\n',
    '3\n',
    TRUE,
    1
) ON CONFLICT DO NOTHING;

-- Insert a dummy question set for all ratings
INSERT INTO question_sets (id, rating_min, rating_max, q1_id, q2_id, q3_id, q4_id, q5_id, q6_id, q7_id)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    0,
    4000,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111'
) ON CONFLICT DO NOTHING;
