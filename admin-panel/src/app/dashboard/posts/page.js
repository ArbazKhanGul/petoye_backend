'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchTerm]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Admin deletion'
        }),
      });

      if (response.ok) {
        alert('Post deleted successfully');
        fetchPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const viewCompletePost = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            🐾 Pet Post Management
          </h1>
          <p className="text-gray-600">Manage all pet posts and moments shared in the community</p>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Pet Posts
              </label>
              <input
                type="text"
                placeholder="Search by content, user, or keywords..."
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-lg font-medium">
                📊 Total Posts: {posts.length}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-100">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🐾</div>
              <div className="text-xl font-medium">No pet posts found</div>
              <div className="text-gray-400 mt-2">Try adjusting your search criteria</div>
            </div>
          ) : (
            <div className="divide-y divide-orange-100">
              {posts.map((post) => (
                <div key={post._id} className="p-6 hover:bg-orange-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* User Avatar */}
                      <div className="relative">
                        {post.userId?.profileImage ? (
                          <img
                            src={`http://localhost:8000/api${post.userId.profileImage}`}
                            alt={post.userId.fullName}
                            className="w-14 h-14 rounded-full object-cover border-3 border-orange-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-14 h-14 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-orange-200">
                          {post.userId?.fullName?.charAt(0) || '🐾'}
                        </div>
                      </div>
                      
                      {/* Post Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-800">
                            {post.userId?.fullName || 'Unknown User'}
                          </h3>
                          <span className="text-sm text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                            @{post.userId?.username || 'unknown'}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            📅 {new Date(post.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {/* User Email */}
                        <div className="text-sm text-gray-600 mb-3 flex items-center">
                          📧 {post.userId?.email || 'No email'}
                        </div>
                        
                        {/* Post ID */}
                        <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          ID: {post._id}
                        </div>
                        
                        {post.content && (
                          <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-orange-400">
                            <p className="text-gray-800 leading-relaxed">
                              {post.content || 'No text content'}
                            </p>
                          </div>
                        )}
                        
                        {/* Media Files */}
                        {post.mediaFiles && post.mediaFiles.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              🖼️ Media Files ({post.mediaFiles.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {post.mediaFiles.map((media, index) => (
                                <div key={index} className="relative group">
                                  {media.type === 'image' ? (
                                    <div className="relative">
                                      <img
                                        src={`http://localhost:8000/api${media.url}`}
                                        alt="Pet media"
                                        className="w-full h-32 object-cover rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors cursor-pointer"
                                        onError={(e) => {
                                          console.log('Image load error:', e.target.src);
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                        onClick={() => window.open(`http://localhost:8000/api${media.url}`, '_blank')}
                                      />
                                      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex flex-col items-center justify-center border-2 border-orange-200" style={{display: 'none'}}>
                                        <span className="text-orange-500 text-2xl mb-1">🖼️</span>
                                        <span className="text-orange-700 text-sm font-medium">Image not found</span>
                                        <span className="text-xs text-gray-500 mt-1 px-2 text-center">{media.url}</span>
                                      </div>
                                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                        📷 IMG
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex flex-col items-center justify-center border-2 border-blue-200">
                                      <span className="text-blue-600 text-2xl mb-1">🎥</span>
                                      <span className="text-blue-700 text-sm font-medium">Video</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Post Stats */}
                        <div className="flex items-center space-x-6 text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <span className="flex items-center font-medium text-red-600">
                            ❤️ {post.likesCount} likes
                          </span>
                          <span className="flex items-center font-medium text-blue-600">
                            💬 {post.commentsCount} comments
                          </span>
                          <span className="flex items-center font-medium text-gray-600">
                            📊 Engagement: {((post.likesCount + post.commentsCount) > 0 ? 'High' : 'Low')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => viewCompletePost(post)}
                        className="px-4 py-2 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors font-medium"
                      >
                        👁️ View Complete
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 flex items-center justify-between border-t border-orange-200">
              <div className="flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-white hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-white hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    📄 Page <span className="font-bold text-orange-600">{currentPage}</span> of{' '}
                    <span className="font-bold text-orange-600">{totalPages}</span>
                  </p>
                </div>
                <div className="space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                            : 'text-orange-700 hover:bg-orange-100 border border-orange-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complete Post Modal */}
        {showModal && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    🐾 Complete Post Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                  <div className="relative">
                    {selectedPost.userId?.profileImage ? (
                      <img
                        src={`http://localhost:8000/api${selectedPost.userId.profileImage}`}
                        alt={selectedPost.userId.fullName}
                        className="w-16 h-16 rounded-full object-cover border-3 border-orange-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-2xl border-3 border-orange-200">
                      {selectedPost.userId?.fullName?.charAt(0) || '🐾'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{selectedPost.userId?.fullName || 'Unknown User'}</h3>
                    <p className="text-orange-600 font-medium">@{selectedPost.userId?.username || 'unknown'}</p>
                    <p className="text-gray-600">📧 {selectedPost.userId?.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(selectedPost.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Post ID */}
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-mono text-gray-600">
                    <strong>Post ID:</strong> {selectedPost._id}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Last Updated:</strong> {new Date(selectedPost.updatedAt).toLocaleString()}
                  </p>
                </div>

                {/* Post Content */}
                {selectedPost.content && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border-l-4 border-orange-400">
                    <h4 className="font-semibold text-gray-700 mb-2">📝 Post Content:</h4>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                )}

                {/* Media Files */}
                {selectedPost.mediaFiles && selectedPost.mediaFiles.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                      🖼️ Media Files ({selectedPost.mediaFiles.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedPost.mediaFiles.map((media, index) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <div className="relative">
                              <img
                                src={`http://localhost:8000/api${media.url}`}
                                alt={`Pet media ${index + 1}`}
                                className="w-full h-48 object-cover rounded-xl border-3 border-orange-200 hover:border-orange-400 transition-colors cursor-pointer"
                                onClick={() => window.open(`http://localhost:8000/api${media.url}`, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex flex-col items-center justify-center border-3 border-orange-200" style={{display: 'none'}}>
                                <span className="text-orange-500 text-4xl mb-2">🖼️</span>
                                <span className="text-orange-700 font-medium">Image not found</span>
                                <span className="text-xs text-gray-500 mt-2 px-4 text-center break-all">{media.url}</span>
                              </div>
                              <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                                📷 Image {index + 1}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex flex-col items-center justify-center border-3 border-blue-200">
                              <span className="text-blue-600 text-4xl mb-2">🎥</span>
                              <span className="text-blue-700 font-medium">Video File</span>
                              <span className="text-xs text-gray-500 mt-2 px-4 text-center break-all">{media.url}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border-2 border-red-200">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">❤️</span>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{selectedPost.likesCount}</p>
                        <p className="text-sm text-red-700 font-medium">Likes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">💬</span>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{selectedPost.commentsCount}</p>
                        <p className="text-sm text-blue-700 font-medium">Comments</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">📊</span>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {((selectedPost.likesCount + selectedPost.commentsCount) > 5 ? 'High' : 
                            (selectedPost.likesCount + selectedPost.commentsCount) > 1 ? 'Medium' : 'Low')}
                        </p>
                        <p className="text-sm text-green-700 font-medium">Engagement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedPost._id);
                      closeModal();
                    }}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
