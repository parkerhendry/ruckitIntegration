/**
 * Geotab Ruckit Device Mapping Button Add-in
 * Creates a dropdown interface for managing Ruckit device mappings
 */
geotab.customButtons.ruckitDeviceMapping = (event, api, state) => {
    'use strict';

    let currentDeviceId = null;
    let existingMapping = null;
    let dropdownElement = null;

    /**
     * Get the current device ID from page state
     */
    function getCurrentDeviceId() {
        let deviceId = null;
        try {
            const pageState = state.getState();
            if (pageState && pageState.id && pageState.id.length) {
                deviceId = pageState.id;
            }
        } catch (error) {
            console.error('Error getting device ID from state:', error);
        }
        return deviceId;
    }

    /**
     * Make a Geotab API call
     */
    function makeGeotabCall(method, typeName, parameters = {}) {
        return new Promise((resolve, reject) => {
            const callParams = {
                typeName: typeName,
                ...parameters
            };
            
            api.call(method, callParams, resolve, reject);
        });
    }

    /**
     * Get AddInData entries for Ruckit mappings
     */
    async function getRuckitMappings() {
        try {
            const searchParams = {
                whereClause: 'type = "ri-device"'
            };
            
            const data = await makeGeotabCall("Get", "AddInData", { search: searchParams });
            return data || [];
        } catch (error) {
            console.error('Error fetching Ruckit mappings:', error);
            return [];
        }
    }

    /**
     * Find existing mapping for current device
     */
    async function findExistingMapping(deviceId) {
        if (!deviceId) return null;
        
        const mappings = await getRuckitMappings();
        return mappings.find(mapping => 
            mapping.details && 
            mapping.details['gt-device'] === deviceId
        ) || null;
    }

    /**
     * Create the dropdown interface
     */
    function createDropdown() {
        // Remove existing dropdown if present
        removeDropdown();

        const dropdown = document.createElement('div');
        dropdown.id = 'ruckit-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 15px;
            min-width: 280px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        const defaultToken = existingMapping?.details?.['ri-token'] || 'TOKEN';
        const defaultDevice = existingMapping?.details?.['ri-device'] || 'DeviceID';
        const defaultDriver = existingMapping?.details?.['ri-driver'] || 'DriverID';

        dropdown.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #333;">
                Ruckit Device Mapping
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ruckit TOKEN:</label>
                <input type="text" id="ruckit-token" value="${defaultToken}" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ruckit Device ID:</label>
                <input type="text" id="ruckit-device" value="${defaultDevice}" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ruckit Driver ID:</label>
                <input type="text" id="ruckit-driver" value="${defaultDriver}" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="ruckit-clear" style="
                    flex: 1; 
                    padding: 8px 12px; 
                    background: #f5f5f5; 
                    border: 1px solid #ddd; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 14px;
                ">Clear</button>
                <button id="ruckit-submit" style="
                    flex: 1; 
                    padding: 8px 12px; 
                    background: #007bff; 
                    color: white; 
                    border: 1px solid #007bff; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 14px;
                ">Submit</button>
            </div>
            <div id="ruckit-status" style="
                margin-top: 10px; 
                padding: 8px; 
                border-radius: 3px; 
                display: none;
                font-size: 12px;
            "></div>
        `;

        // Position dropdown relative to the button
        const buttonRect = event.target.getBoundingClientRect();
        const container = event.target.closest('.geotab-page') || document.body;
        container.appendChild(dropdown);

        // Position the dropdown
        dropdown.style.position = 'fixed';
        dropdown.style.top = (buttonRect.bottom + 5) + 'px';
        dropdown.style.left = (buttonRect.right - dropdown.offsetWidth) + 'px';

        // Ensure dropdown stays within viewport
        if (dropdown.getBoundingClientRect().bottom > window.innerHeight) {
            dropdown.style.top = (buttonRect.top - dropdown.offsetHeight - 5) + 'px';
        }
        if (dropdown.getBoundingClientRect().left < 0) {
            dropdown.style.left = '10px';
        }

        dropdownElement = dropdown;

        // Add event listeners
        setupDropdownEventListeners();
    }

    /**
     * Setup event listeners for dropdown
     */
    function setupDropdownEventListeners() {
        if (!dropdownElement) return;

        // Submit button
        const submitBtn = dropdownElement.querySelector('#ruckit-submit');
        submitBtn.addEventListener('click', handleSubmit);

        // Clear button
        const clearBtn = dropdownElement.querySelector('#ruckit-clear');
        clearBtn.addEventListener('click', handleClear);

        // Close dropdown when clicking outside
        document.addEventListener('click', handleOutsideClick);

        // Close dropdown on escape key
        document.addEventListener('keydown', handleEscapeKey);
    }

    /**
     * Check if credentials are already in use by another device
     */
    async function validateCredentials(token, device, driver) {
        try {
            const allMappings = await getRuckitMappings();
            
            for (const mapping of allMappings) {
                if (!mapping.details) continue;
                
                // Skip the current device's mapping
                if (mapping.details['gt-device'] === currentDeviceId) continue;
                
                // Check if any of the credentials are already in use
                const existingToken = mapping.details['ri-token'];
                const existingDevice = mapping.details['ri-device'];
                const existingDriver = mapping.details['ri-driver'];
                
                if (existingToken === token && existingToken !== 'TOKEN') {
                    return `Token "${token}" is already in use by device ${mapping.details['gt-device']}`;
                }
                
                if (existingDevice === device && existingDevice !== 'DeviceID') {
                    return `Device ID "${device}" is already in use by device ${mapping.details['gt-device']}`;
                }
                
                if (existingDriver === driver && existingDriver !== 'DriverID') {
                    return `Driver ID "${driver}" is already in use by device ${mapping.details['gt-device']}`;
                }
            }
            
            return null; // No conflicts found
        } catch (error) {
            console.error('Error validating credentials:', error);
            return 'Error validating credentials';
        }
    }

    /**
     * Handle submit button click
     */
    async function handleSubmit() {
        const tokenInput = dropdownElement.querySelector('#ruckit-token');
        const deviceInput = dropdownElement.querySelector('#ruckit-device');
        const driverInput = dropdownElement.querySelector('#ruckit-driver');
        const statusDiv = dropdownElement.querySelector('#ruckit-status');

        const token = tokenInput.value.trim();
        const device = deviceInput.value.trim();
        const driver = driverInput.value.trim();

        if (!token || !device || !driver) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        if (!currentDeviceId) {
            showStatus('Device ID not available', 'error');
            return;
        }

        // Check if credentials are default values
        if (token === 'TOKEN' || device === 'DeviceID' || driver === 'DriverID') {
            showStatus('Please enter actual values, not default placeholders', 'error');
            return;
        }

        try {
            showStatus('Validating credentials...', 'info');

            // Validate credentials are not already in use
            const validationError = await validateCredentials(token, device, driver);
            if (validationError) {
                showStatus(validationError, 'error');
                return;
            }

            showStatus('Saving mapping...', 'info');

            const mappingData = {
                addInId: "aTMyNTA4NjktMzIxOC02YTQ",
                details: {
                    'date': new Date().toISOString(),
                    'gt-device': currentDeviceId,
                    'ri-token': token,
                    'ri-device': device,
                    'ri-driver': driver,
                    'type': 'ri-device'
                },
                id: null
            };

            if (existingMapping) {
                // Update existing mapping
                mappingData.id = existingMapping.id;
                mappingData.version = existingMapping.version;
                await makeGeotabCall("Set", "AddInData", { entity: mappingData });
            } else {
                // Create new mapping
                await makeGeotabCall("Add", "AddInData", { entity: mappingData });
            }

            showStatus('Mapping saved successfully!', 'success');
            
            // Update existing mapping reference
            existingMapping = {
                ...existingMapping,
                details: mappingData.details
            };

            setTimeout(() => {
                removeDropdown();
            }, 1500);

        } catch (error) {
            console.error('Error saving mapping:', error);
            showStatus('Error saving mapping: ' + error.message, 'error');
        }
    }

    /**
     * Handle clear button click
     */
    async function handleClear() {
        if (!existingMapping || !currentDeviceId) {
            // Just clear the form if no existing mapping
            const tokenInput = dropdownElement.querySelector('#ruckit-token');
            const deviceInput = dropdownElement.querySelector('#ruckit-device');
            const driverInput = dropdownElement.querySelector('#ruckit-driver');
            
            tokenInput.value = 'TOKEN';
            deviceInput.value = 'DeviceID';
            driverInput.value = 'DriverID';
            
            showStatus('Fields cleared', 'info');
            return;
        }

        try {
            showStatus('Clearing mapping...', 'info');

            const mappingData = {
                id: existingMapping.id,
                version: existingMapping.version,
                type: 'ri-device',
                device: { id: currentDeviceId },
                details: {
                    'gt-device': currentDeviceId,
                    'ri-token': 'TOKEN',
                    'ri-device': 'DeviceID',
                    'ri-driver': 'DriverID'
                }
            };

            await makeGeotabCall("Set", "AddInData", { entity: mappingData });

            showStatus('Mapping cleared successfully!', 'success');
            
            // Update form fields
            const tokenInput = dropdownElement.querySelector('#ruckit-token');
            const deviceInput = dropdownElement.querySelector('#ruckit-device');
            const driverInput = dropdownElement.querySelector('#ruckit-driver');
            
            tokenInput.value = 'TOKEN';
            deviceInput.value = 'DeviceID';
            driverInput.value = 'DriverID';

            // Clear existing mapping reference
            existingMapping = {
                ...existingMapping,
                details: mappingData.details
            };

            setTimeout(() => {
                removeDropdown();
            }, 1500);

        } catch (error) {
            console.error('Error clearing mapping:', error);
            showStatus('Error clearing mapping: ' + error.message, 'error');
        }
    }

    /**
     * Show status message
     */
    function showStatus(message, type) {
        const statusDiv = dropdownElement.querySelector('#ruckit-status');
        if (!statusDiv) return;

        const colors = {
            success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
            info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
        };

        const color = colors[type] || colors.info;

        statusDiv.style.display = 'block';
        statusDiv.style.backgroundColor = color.bg;
        statusDiv.style.color = color.text;
        statusDiv.style.border = `1px solid ${color.border}`;
        statusDiv.textContent = message;
    }

    /**
     * Handle clicking outside dropdown
     */
    function handleOutsideClick(e) {
        if (dropdownElement && !dropdownElement.contains(e.target) && e.target !== event.target) {
            removeDropdown();
        }
    }

    /**
     * Handle escape key
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && dropdownElement) {
            removeDropdown();
        }
    }

    /**
     * Remove dropdown and cleanup
     */
    function removeDropdown() {
        if (dropdownElement) {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleEscapeKey);
            dropdownElement.remove();
            dropdownElement = null;
        }
    }

    /**
     * Initialize and show dropdown
     */
    async function init() {
        try {
            // Get current device ID
            currentDeviceId = getCurrentDeviceId();
            
            if (!currentDeviceId) {
                alert('Device ID not available from current page');
                return;
            }

            // Find existing mapping
            existingMapping = await findExistingMapping(currentDeviceId);

            // Create and show dropdown
            createDropdown();

        } catch (error) {
            console.error('Error initializing Ruckit mapping:', error);
            alert('Error initializing Ruckit mapping: ' + error.message);
        }
    }

    // Initialize the dropdown
    init();
};