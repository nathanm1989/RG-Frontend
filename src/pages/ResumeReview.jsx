import { useState } from "react";
import {
  Container,
  Button,
  Form,
  Spinner,
  Row,
  Col,
  Card,
  Alert,
} from "react-bootstrap";

const ResumeReview = ({ resume, token, onBack }) => {
  const [form, setForm] = useState({ ...resume });
  const [jdUrl, setJdUrl] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  // const [downloadLinks, setDownloadLinks] = useState(null);
  const [error, setError] = useState(null);

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/generate/resume-finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            jdUrl,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Resume finalized and saved!");

        const res = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL
          }/api/bidder/download?filePath=${encodeURIComponent(data.name)}.docx`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          alert("Download failed.");
          return;
        }

        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);;
        link.download = `${data.name}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        onBack();
      } else {
        setError(data.message || "Failed to finalize resume");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while finalizing.");
    } finally {
      setFinalizing(false);
    }
  };

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const renderBullets = (section, label) => (
    <Card className="mb-3" key={section}>
      <Card.Body>
        <Card.Title>{label}</Card.Title>
        {form[section].map((val, idx) => (
          <Form.Control
            key={idx}
            as="textarea"
            rows={2}
            className="mb-2"
            value={val}
            onChange={(e) => {
              const copy = [...form[section]];
              copy[idx] = e.target.value;
              update(section, copy);
            }}
          />
        ))}
      </Card.Body>
    </Card>
  );

  return (
    <Container className="my-4">
      <h3 className="mb-4">📝 Resume Preview & Edit</h3>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Company</Form.Label>
        <Form.Control
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          value={form.roleTitle}
          onChange={(e) => update("roleTitle", e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Summary</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
        />
      </Form.Group>

      {/* <Form.Group className="mb-3">
        <Form.Label>Skills (comma-separated)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.skills.join(", ")}
          onChange={(e) => update("skills", e.target.value.split(","))}
        />
      </Form.Group> */}

      {renderBullets("experience_first", "Experience Section 1")}
      {renderBullets("experience_second", "Experience Section 2")}
      {renderBullets("experience_third", "Experience Section 3")}

      <Form.Group className="mb-4">
        <Form.Label>Job Description URL (optional)</Form.Label>
        <Form.Control
          type="text"
          value={jdUrl}
          onChange={(e) => setJdUrl(e.target.value)}
        />
      </Form.Group>

      <Row className="mb-4">
        <Col xs="auto">
          <Button onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Finalizing...
              </>
            ) : (
              "Finalize Resume"
            )}
          </Button>
        </Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </Col>
      </Row>

      {/* {downloadLinks && (
        <Card>
          <Card.Body>
            <Card.Title>✅ Resume Generated</Card.Title>
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = downloadLinks.resumeUrl;
                link.download = "";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Resume (.docx) Again
            </Button>
          </Card.Body>
        </Card>
      )} */}
    </Container>
  );
};

export default ResumeReview;
