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
     * Get device information from Geotab
     */
    async function getDeviceInfo(deviceId) {
        try {
            const devices = await makeGeotabCall("Get", "Device", { 
                search: { id: deviceId } 
            });
            
            if (devices && devices.length > 0) {
                return {
                    name: devices[0].name || 'Unknown Device',
                    serialNumber: devices[0].serialNumber || ''
                };
            }
            
            return { name: 'Unknown Device', serialNumber: '' };
        } catch (error) {
            console.error('Error fetching device info:', error);
            return { name: 'Unknown Device', serialNumber: '' };
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
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #ff6b35;
            border-radius: 12px;
            box-shadow: 0 8px 25px #ff6b35, 0 0 0 1px #ff6b35;
            padding: 0;
            min-width: 320px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            overflow: hidden;
        `;

        const defaultToken = existingMapping?.details?.['ri-token'] || 'TOKEN';
        const defaultDevice = existingMapping?.details?.['ri-device'] || 'DeviceID';
        const defaultDriver = existingMapping?.details?.['ri-driver'] || 'DriverID';

        dropdown.innerHTML = `
            <!-- Header with logo space -->
            <div style="
                background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                padding: 16px 20px;
                margin: 0;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div id="company-logo" style="
                        width: 96px;
                        height: 96px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <!-- Replace this div with your logo image -->
                        <img src="https://traxxisgps.com/wp-content/uploads/elementor/thumbs/Traxxis-refresh-logo_horizontal-min-1-qjgvd5cr9kxu5eay6trn10pbylz31ardqnqdluuew0.webp" alt="Company Logo" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div style="
                        font-weight: 600;
                        color: white;
                        font-size: 20px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    ">
                        Ruckit Device Mapping
                    </div>
                </div>
            </div>

            <!-- Form content -->
            <div style="padding: 20px;">
                <div style="margin-bottom: 16px;">
                    <label style="
                        display: block;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: #2c3e50;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Ruckit TOKEN:</label>
                    <input type="text" id="ruckit-token" value="${defaultToken}" 
                        style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 2px solid #e1e8ed;
                            border-radius: 8px;
                            box-sizing: border-box;
                            font-size: 14px;
                            transition: all 0.2s ease;
                            background: #ffffff;
                        "
                        onfocus="this.style.borderColor='#ff6b35'; this.style.boxShadow='0 0 0 3px rgba(255,107,53,0.1)'"
                        onblur="this.style.borderColor='#e1e8ed'; this.style.boxShadow='none'">
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="
                        display: block;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: #2c3e50;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Ruckit Device ID:</label>
                    <input type="text" id="ruckit-device" value="${defaultDevice}" 
                        style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 2px solid #e1e8ed;
                            border-radius: 8px;
                            box-sizing: border-box;
                            font-size: 14px;
                            transition: all 0.2s ease;
                            background: #ffffff;
                        "
                        onfocus="this.style.borderColor='#ff6b35'; this.style.boxShadow='0 0 0 3px rgba(255,107,53,0.1)'"
                        onblur="this.style.borderColor='#e1e8ed'; this.style.boxShadow='none'">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: #2c3e50;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Ruckit Driver ID:</label>
                    <input type="text" id="ruckit-driver" value="${defaultDriver}" 
                        style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 2px solid #e1e8ed;
                            border-radius: 8px;
                            box-sizing: border-box;
                            font-size: 14px;
                            transition: all 0.2s ease;
                            background: #ffffff;
                        "
                        onfocus="this.style.borderColor='#ff6b35'; this.style.boxShadow='0 0 0 3px rgba(255,107,53,0.1)'"
                        onblur="this.style.borderColor='#e1e8ed'; this.style.boxShadow='none'">
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="ruckit-clear" style="
                        flex: 1;
                        padding: 12px 16px;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        color: #495057;
                        border: 2px solid #dee2e6;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    "
                    onmouseover="this.style.background='linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'; this.style.transform='translateY(0)'">
                        Clear
                    </button>
                    <button id="ruckit-submit" style="
                        flex: 1;
                        padding: 12px 16px;
                        background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                        color: white;
                        border: 2px solid #4a90e2;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: 0 2px 4px rgba(74,144,226,0.2);
                    "
                    onmouseover="this.style.background='linear-gradient(135deg, #357abd 0%, #2968a3 100%)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(74,144,226,0.3)'"
                    onmouseout="this.style.background='linear-gradient(135deg, #4a90e2 0%, #357abd 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(74,144,226,0.2)'">
                        Submit
                    </button>
                </div>
            </div>
            
            <div id="ruckit-status" style="
                margin: 0 20px 20px 20px;
                padding: 12px 16px;
                border-radius: 8px;
                display: none;
                font-size: 13px;
                font-weight: 500;
                border-left: 4px solid;
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
            
            // Create a map of device IDs to device names for better error messages
            const deviceInfoMap = {};
            
            for (const mapping of allMappings) {
                if (!mapping.details) continue;
                
                const gtDevice = mapping.details['gt-device'];
                if (gtDevice && !deviceInfoMap[gtDevice]) {
                    // Get device info if we don't have it yet
                    const deviceInfo = await getDeviceInfo(gtDevice);
                    deviceInfoMap[gtDevice] = deviceInfo.name;
                }
                
                // Skip the current device's mapping
                if (gtDevice === currentDeviceId) continue;
                
                // Check if any of the credentials are already in use
                const existingToken = mapping.details['ri-token'];
                const existingDevice = mapping.details['ri-device'];
                const existingDriver = mapping.details['ri-driver'];
                const deviceName = deviceInfoMap[gtDevice] || 'Unknown Device';
                
                if (existingToken === token && existingToken !== 'TOKEN') {
                    return `Token "${token}" is already in use by device "${deviceName}"`;
                }
                
                if (existingDevice === device && existingDevice !== 'DeviceID') {
                    return `Device ID "${device}" is already in use by device "${deviceName}"`;
                }
                
                if (existingDriver === driver && existingDriver !== 'DriverID') {
                    return `Driver ID "${driver}" is already in use by device "${deviceName}"`;
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

            showStatus('Getting device information...', 'info');

            // Get device information
            const deviceInfo = await getDeviceInfo(currentDeviceId);

            showStatus('Saving mapping...', 'info');

            const mappingData = {
                addInId: "aTMyNTA4NjktMzIxOC02YTQ",
                details: {
                    'date': new Date().toISOString(),
                    'gt-device': currentDeviceId,
                    'name': deviceInfo.name,
                    'gt-sn': deviceInfo.serialNumber,
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
            showStatus('Getting device information...', 'info');

            // Get device information
            const deviceInfo = await getDeviceInfo(currentDeviceId);

            showStatus('Clearing mapping...', 'info');

            const mappingData = {
                addInId: "aTMyNTA4NjktMzIxOC02YTQ",
                details: {
                    'date': new Date().toISOString(),
                    'gt-device': currentDeviceId,
                    'name': deviceInfo.name,
                    'gt-sn': deviceInfo.serialNumber,
                    'ri-token': 'TOKEN',
                    'ri-device': 'DeviceID',
                    'ri-driver': 'DriverID',
                    'type': 'ri-device'
                },
                id: existingMapping.id,
                version: existingMapping.version
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