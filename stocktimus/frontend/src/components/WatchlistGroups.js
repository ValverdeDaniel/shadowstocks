import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';
import WatchlistContractCard from './WatchlistContractCard';

function WatchlistGroups({
  groups,
  onRunGroup,
  fetchGroups,
  selectedContracts,
  setSelectedContracts,
  handleRunSelected,
  handleBulkDelete,
  handleBulkAssign,
}) {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [contractsForAssignment, setContractsForAssignment] = useState([]);

  const openAssignModalForContracts = (contracts) => {
    setContractsForAssignment(contracts);
    setAssignModalVisible(true);
  };

  const handleResetDays = async (contractId) => {
    try {
      const res = await fetch(`/api/saved-contracts/${contractId}/reset-days/`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Reset failed');
      await fetchGroups();
    } catch (err) {
      console.error("Error resetting countdown:", err);
      alert("Reset failed.");
    }
  };

  const handleRefresh = async (contractId) => {
    try {
      const res = await fetch(`/api/saved-contracts/${contractId}/refresh/`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Refresh failed');
      await fetchGroups();
    } catch (err) {
      console.error("Error refreshing contract:", err);
      alert("Refresh failed.");
    }
  };

  // ✅ Updated to remove contract from specific group only
  const handleDeleteContract = async (contractId, groupId) => {
    try {
      const res = await fetch(`/api/watchlist-groups/${groupId}/contracts/${contractId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete from group failed');
      await fetchGroups();
    } catch (err) {
      console.error("Error removing contract from group:", err);
      alert("Remove failed.");
    }
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">📂 Watchlist Groups</h3>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="card card-hover">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-primary">{group.name}</span>
              <button
                onClick={() => onRunGroup(group.id)}
                className="btn-primary text-xs"
              >
                Run Group
              </button>
            </div>

            {group.contracts.length > 0 ? (
              <div className="text-sm text-muted pl-1 space-y-2">
                {[...group.contracts]
                  .sort((a, b) => a.ticker.localeCompare(b.ticker))
                  .map((c) => (
                    <WatchlistContractCard
                      key={c.id}
                      contract={c}
                      isSelected={selectedContracts.includes(c.id)}
                      onSelect={(id, checked) => {
                        if (checked) {
                          setSelectedContracts((prev) => [...prev, id]);
                        } else {
                          setSelectedContracts((prev) => prev.filter((cid) => cid !== id));
                        }
                      }}
                      onReset={handleResetDays}
                      onRefresh={handleRefresh}
                      onUpdateGroups={(id) => openAssignModalForContracts([id])}
                      onDelete={(id) => handleDeleteContract(id, group.id)} // ✅ Now uses group ID
                    />
                  ))}
              </div>
            ) : (
              <div className="text-sm text-muted pl-1 italic">
                (No contracts assigned)
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedContracts.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={handleRunSelected} className="btn-primary">Run Selected</button>
          <button onClick={handleBulkDelete} className="btn-red">Delete Selected</button>
          <button
            onClick={() => openAssignModalForContracts(selectedContracts)}
            className="btn-primary"
          >
            Assign Selected to Groups
          </button>
        </div>
      )}

      <WatchlistAssignGroupsModal
        isOpen={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        groups={groups}
        fetchGroups={fetchGroups}
        contracts={contractsForAssignment}
        onAssign={async (selectedGroupIds, mode) => {
          try {
            for (const groupId of selectedGroupIds) {
              const response = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contract_ids: contractsForAssignment,
                  mode,
                }),
              });
              if (!response.ok) throw new Error(`Failed assigning contracts to group ${groupId}`);
            }
            alert('Contracts assigned successfully!');
            setAssignModalVisible(false);
            await fetchGroups();
          } catch (error) {
            console.error('Error assigning contracts:', error);
            alert('Failed to assign contracts to groups.');
          }
        }}
      />
    </div>
  );
}

export default WatchlistGroups;
