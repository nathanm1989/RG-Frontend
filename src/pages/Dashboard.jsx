import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  ListGroup,
  Card,
  Table,
  Form,
} from "react-bootstrap";

const Dashboard = ({ mode = "bidder", bidderId = null }) => {
  const { user, logout } = useAuth();
  const [fileMap, setFileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/files`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/bidder-files/${bidderId}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.status === 401) {
        alert("Session expired. Please sign in again.");
        logout();
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setFileMap(data); // { date: [ { name, jdUrl }, ... ] }
      } else {
        setError(data.message || "Failed to load files");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (url) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/delete-file`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/delete-bidder-file/${bidderId}`;

      const res = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ name: url }),
        }
      );

      if (res.ok) {
        fetchFiles();
        alert("File deleted successfully");
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    }
  };

  const downloadZip = async (date) => {
    const url =
      mode === "developer"
        ? `${process.env.REACT_APP_BACKEND_URL}/api/dev/download-folder/${bidderId}?date=${date}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/bidder/download-folder?date=${date}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to download ZIP");
        return;
      }

      const blob = await res.blob();

      if (blob.type !== "application/zip") {
        const text = await blob.text();
        alert("Download failed: " + text);
        return;
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${date}-resumes.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Download error");
    }
  };

  const normalize = (str) => str.toLowerCase().replace(/[\s\-_]/g, "");

  const filteredFileMap = Object.entries(fileMap)
    .filter(([date]) => {
      const afterStart = !startDate || date >= startDate;
      const beforeEnd = !endDate || date <= endDate;
      return afterStart && beforeEnd;
    })
    .reduce((acc, [date, files]) => {
      const filteredFiles = files.filter((file) =>
        normalize(file.name).includes(normalize(searchTerm))
      );
      if (filteredFiles.length > 0) {
        acc[date] = filteredFiles;
      }
      return acc;
    }, {});

  const secureDownload = async (name, extension) => {
    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/download?filePath=${encodeURIComponent(name)}${extension}`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/download-resume/${bidderId}?filePath=${encodeURIComponent(name)}${extension}`;

      const res = await fetch(
        endpoint,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!res.ok) {
        alert("Download failed.");
        return;
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${name}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Secure download error:", err);
      alert("Error downloading file.");
    }
  };

  useEffect(() => {
    if (mode === "developer" && !bidderId) return;
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidderId]);

  return (
    <Container className="my-4">
      <h2 className="mb-4">
        {mode === "developer" ? "Bidder's Resumes" : "My Resumes"}
      </h2>

      <Form className="mb-4">
        <Row className="g-3 align-items-end">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label>Search Filename</Form.Label>
              <Form.Control
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., FrontendEngineer"
              />
            </Form.Group>
          </Col>

          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md="auto">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" />
          <span>Loading files...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : Object.keys(filteredFileMap).length === 0 ? (
        <p>No resumes match your filters.</p>
      ) : (
        Object.entries(filteredFileMap).map(([date, files]) => (
          <Card key={date} className="mb-4 shadow-sm">
            <Card.Header as="h5">
              {date} -{" "}
              <small className="text-muted">{files.length} file(s)</small>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Resume (.docx)</th>
                    <th>Job Description (.txt)</th>
                    <th>JD URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    return (
                      <tr key={file.url}>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => secureDownload(file.name, ".docx")}
                          >
                            {file.name}.docx
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => secureDownload(file.name, ".txt")}
                          >
                            {file.name}.txt
                          </Button>
                        </td>
                        <td>
                          {file.jdUrl ? (
                            <a
                              href={file.jdUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View JD
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(file.name)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="mt-3">
                <Button variant="success" onClick={() => downloadZip(date)}>
                  ⬇️ Download All for {date}
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default Dashboard;
