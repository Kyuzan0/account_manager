import React, { useState } from 'react';
import { nameService } from '../../services/nameService';
import { toast } from 'react-toastify';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [platform, setPlatform] = useState('general');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    console.log('DEBUG: Upload process started');
    
    if (!selectedFile) {
      console.log('DEBUG: No file selected');
      toast.error('Please select a file first');
      return;
    }

    console.log('DEBUG: File selected:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);
    console.log('DEBUG: Platform:', platform);

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('platform', platform);

    try {
      console.log('DEBUG: Sending request to server');
      const response = await nameService.uploadNames(formData);
      console.log('DEBUG: Server response:', response);
      toast.success(`Successfully uploaded ${response.count} names!`);
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.log('DEBUG: Upload error:', error);
      console.log('DEBUG: Error response:', error.response);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Names File</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Platform
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="general">General</option>
          <option value="roblox">Roblox</option>
          <option value="google">Google</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      <div
        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 4L13 9m0 3H4m0 0h18m0 0h18" />
          </svg>
          <div className="flex text-sm text-gray-400">
            <label className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
              <span>Upload a file</span>
              <input
                type="file"
                className="sr-only"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">CSV, Excel up to 5MB</p>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 p-4 bg-gray-700 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 2-2m0 6l2 2 2-2m-6 6l2 2 2-2" />
              </svg>
              <span className="ml-2 text-sm text-white">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Uploading...
          </div>
        ) : (
          'Upload File'
        )}
      </button>

      <div className="mt-4 text-sm text-gray-400">
        <p className="font-medium text-white">File format requirements:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>CSV file with name column header (supports: "name", "full_name", "nama", "nama_lengkap")</li>
          <li>Excel file with name column in first sheet (supports: "name", "full_name", "nama", "nama_lengkap")</li>
          <li>Maximum file size: 5MB</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;