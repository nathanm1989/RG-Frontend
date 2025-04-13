import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ResumeReview from "./ResumeReview";
import {
  Container,
  Button,
  Form,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";

const BiddingPage = () => {
  const { user } = useAuth();
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeDraft, setResumeDraft] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!jobDesc.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/generate/resume-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ jobDescription: jobDesc }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setResumeDraft({ ...data.resume, jobDescription: jobDesc });
      } else {
        setError(data.message || "Resume generation failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (resumeDraft) {
    return (
      <Container className="my-4">
        <ResumeReview
          resume={resumeDraft}
          token={user.token}
          onBack={() => setResumeDraft(null)}
        />
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2 className="mb-4">Resume Bidding</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Paste Job Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={8}
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          placeholder="Paste the job description here..."
        />
      </Form.Group>

      <Row>
        <Col xs="auto">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                  role="status"
                />
                Generating...
              </>
            ) : (
              "Generate Resume Draft"
            )}
          </Button>
        </Col>
        <Col xs="auto">
          <Button
            variant="secondary"
            onClick={() => setJobDesc("")}
            disabled={loading}
          >
            Clear
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default BiddingPage;
