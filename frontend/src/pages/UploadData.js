import React, { useState } from 'react';
import FileUpload from '../components/names/FileUpload';

const UploadData = () => {
  const [uploadData, setUploadData] = useState({
    file: null,
    fileType: 'csv',
    description: '',
    tags: []
  });
  
  const [uploadHistory, setUploadHistory] = useState([
    {
      id: 1,
      fileName: 'accounts_backup.csv',
      fileType: 'CSV',
      uploadDate: new Date('2023-10-15T10:30:00'),
      status: 'completed',
      recordsProcessed: 150
    },
    {
      id: 2,
      fileName: 'passwords.json',
      fileType: 'JSON',
      uploadDate: new Date('2023-10-14T15:45:00'),
      status: 'completed',
      recordsProcessed: 89
    },
    {
      id: 3,
      fileName: 'usernames.xlsx',
      fileType: 'Excel',
      uploadDate: new Date('2023-10-13T09:20:00'),
      status: 'failed',
      recordsProcessed: 0,
      error: 'Invalid file format'
    }
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData(prev => ({
        ...prev,
        file,
        fileName: file.name
      }));
    }
  };

  const handleFileTypeChange = (e) => {
    setUploadData(prev => ({
      ...prev,
      fileType: e.target.value
    }));
  };

  const handleDescriptionChange = (e) => {
    setUploadData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleTagAdd = (tag) => {
    if (tag && !uploadData.tags.includes(tag)) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpload = async () => {
    if (!uploadData.file) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        
        // Add to upload history
        const newUpload = {
          id: uploadHistory.length + 1,
          fileName: uploadData.file.name,
          fileType: uploadData.fileType.toUpperCase(),
          uploadDate: new Date(),
          status: 'completed',
          recordsProcessed: Math.floor(Math.random() * 200) + 50
        };
        
        setUploadHistory(prev => [newUpload, ...prev]);
        setUploadData({
          file: null,
          fileType: 'csv',
          description: '',
          tags: []
        });
        
        alert('File uploaded successfully!');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Upload failed. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Upload Data
        </h1>
        <p className="text-gray-400">
          Import your account data from various file formats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Upload File
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Select File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.json,.xlsx,.xls"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {uploadData.file && (
                <p className="text-gray-400 text-sm mt-2">
                  Selected: {uploadData.file.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                File Type
              </label>
              <select
                value={uploadData.fileType}
                onChange={handleFileTypeChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={uploadData.description}
                onChange={handleDescriptionChange}
                placeholder="Describe the data you're uploading..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTagAdd(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Uploading...</span>
                  <span className="text-gray-300">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading || !uploadData.file}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Upload History
          </h2>
          
          <div className="space-y-3">
            {uploadHistory.map((upload) => (
              <div key={upload.id} className="border-l-4 border-gray-600 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">
                      {upload.fileName}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {upload.fileType} • {upload.uploadDate.toLocaleString()}
                    </p>
                    {upload.error && (
                      <p className="text-red-400 text-sm">
                        Error: {upload.error}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${getStatusColor(upload.status)}`}>
                      <span className="mr-2">{getStatusIcon(upload.status)}</span>
                      <span className="capitalize">{upload.status}</span>
                    </div>
                    {upload.recordsProcessed > 0 && (
                      <p className="text-gray-400 text-sm mt-1">
                        {upload.recordsProcessed} records
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File Upload Component */}
      <div className="mt-8">
        <FileUpload />
      </div>
    </div>
  );
};

export default UploadData;