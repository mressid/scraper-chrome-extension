import { useState, useEffect } from "react";
import { useElementPicker } from "../useElementPicker";
import { PickedElement, ChildElement, ElementType } from "../types";
import SelectedElementInfo from "../SelectedElementInfo";
import {
    detectElementType,
    generateRelativePath,
} from "../algorithms/childElementAlgorithms";
import { useRootElementStore, useChildElementsStore } from "../store";
import { BiDownload } from "react-icons/bi";

export const SelectChildren = () => {
    const rootElementInfo = useRootElementStore((state) => state.rootElementInfo);
    const childElements = useChildElementsStore((state) => state.childElements);
    const addChildElement = useChildElementsStore((state) => state.addChildElement);
    const removeChildElement = useChildElementsStore((state) => state.removeChildElement);

    const [picking, setPicking] = useState(false);
    const [selectedChild, setSelectedChild] = useState<PickedElement | null>(null);
    const [childType, setChildType] = useState<ElementType>('text');
    const [childName, setChildName] = useState('');
    const [isList, setIsList] = useState(false);
    const [childPath, setChildPath] = useState('');
    const [rootNativeElement, setRootNativeElement] = useState<HTMLElement | null>(null);
    const [extractOptions, setExtractOptions] = useState({
        extractText: true,
        extractHref: false,
        extractSrc: false,
        extractAlt: false,
    });

    // Get root element from store info
    useEffect(() => {
        if (rootElementInfo) {
            const { selector, index } = rootElementInfo;
            const allMatching = document.querySelectorAll(selector);
            const rootElement = allMatching[index] as HTMLElement | undefined;
            setRootNativeElement(rootElement || null);
        } else {
            setRootNativeElement(null);
        }
    }, [rootElementInfo]);

    const { startPicker } = useElementPicker(
        (pickedElement) => {
            console.log('Child element picked - Selector:', pickedElement.selector, 'Index:', pickedElement.index);

            // Get the native element using selector and index
            const allMatching = document.querySelectorAll(pickedElement.selector);
            const nativeElement = allMatching[pickedElement.index] as HTMLElement;

            if (!nativeElement) {
                console.error('Could not find element with selector:', pickedElement.selector, 'at index:', pickedElement.index);
                return;
            }

            setSelectedChild(pickedElement);
            const path = generateRelativePath(rootNativeElement, nativeElement);
            setChildPath(path);

            // Auto-detect type based on element
            const detectedType = detectElementType(nativeElement);
            setChildType(detectedType);

            // Set default extraction options based on type
            setDefaultExtractionOptions(detectedType);

            setPicking(false);
        },
        (pickingNewStatus) => {
            setPicking(pickingNewStatus);
        }
    );

    const handleStartPicking = () => {
        if (picking || !rootNativeElement) return;
        setPicking(true);
        startPicker();
    };

    const handleAddChild = () => {
        if (!selectedChild || !childName.trim() || !childPath.trim()) {
            alert('Please fill all required fields');
            return;
        }

        const childId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newChild: ChildElement = {
            id: childId,
            name: childName.trim(),
            type: childType,
            path: childPath,
            isList,
            extractText: extractOptions.extractText,
            extractHref: extractOptions.extractHref,
            extractSrc: extractOptions.extractSrc,
            extractAlt: extractOptions.extractAlt,
        };

        addChildElement(newChild);
        resetForm();
    };

    const resetForm = () => {
        setSelectedChild(null);
        setChildName('');
        setChildType('text');
        setChildPath('');
        setIsList(false);
        setExtractOptions({
            extractText: true,
            extractHref: false,
            extractSrc: false,
            extractAlt: false,
        });
    };

    const setDefaultExtractionOptions = (type: ElementType) => {
        switch (type) {
            case 'text':
                setExtractOptions({
                    extractText: true,
                    extractHref: false,
                    extractSrc: false,
                    extractAlt: false,
                });
                break;
            case 'link':
                setExtractOptions({
                    extractText: true,
                    extractHref: true,
                    extractSrc: false,
                    extractAlt: false,
                });
                break;
            case 'image':
                setExtractOptions({
                    extractText: false,
                    extractHref: false,
                    extractSrc: true,
                    extractAlt: true,
                });
                break;
        }
    };
    const exportRootChildrienData = () => {
        if (!rootNativeElement) {
            return;
        }
        const data = {
            root: rootElementInfo,
            children: childElements,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `json_html_format_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <div className="crx-ext-step-container">
            <div className="crx-ext-step-header">
                <h2>Step 2: Select Child Elements</h2>
                <p className="crx-ext-step-description">
                    Select the individual elements within each root element that you want to extract.
                </p>
            </div>

            {!rootNativeElement ? (
                <div className="crx-ext-warning-message">
                    <p>Please complete Step 1 first. Select a root element to continue.</p>
                </div>
            ) : (
                <>
                    {/* Child Element Picker Form */}
                    <div className="crx-ext-child-form">
                        <div className="crx-ext-form-section">
                            <h3>Pick a Child Element</h3>

                            {selectedChild && (
                                <div className="crx-ext-selected-child-preview">
                                    <h4>Selected Child Element</h4>
                                    <SelectedElementInfo element={selectedChild} />
                                </div>
                            )}

                            <div className="crx-ext-form-group">
                                <label>Element Name</label>
                                <input
                                    type="text"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="e.g., product_title, product_price"
                                />
                            </div>

                            <div className="crx-ext-form-row">
                                <div className="crx-ext-form-group">
                                    <label>Element Type</label>
                                    <select value={childType} onChange={(e) => {
                                        const newType = e.target.value as ElementType;
                                        setChildType(newType);
                                        setDefaultExtractionOptions(newType);
                                    }}>
                                        <option value="text">Text</option>
                                        <option value="link">Link</option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>

                                <div className="crx-ext-form-group">
                                    <label style={{
                                        display: 'flex',
                                        gap: 4,
                                        alignItems: 'center'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={isList}
                                            onChange={(e) => setIsList(e.target.checked)}
                                        />
                                        Is List (Multiple per item)
                                    </label>
                                </div>
                            </div>

                            <div className="crx-ext-form-group">
                                <label>Unique Path</label>
                                <textarea
                                    value={childPath}
                                    onChange={(e) => setChildPath(e.target.value)}
                                    placeholder="Relative path from root element"
                                    rows={3}
                                />
                            </div>

                            {/* Extraction Options based on type */}
                            <div className="crx-ext-extraction-options">
                                <h4>Extract Options</h4>

                                {(childType === 'text' || childType === 'link') && (
                                    <label className="crx-ext-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={extractOptions.extractText}
                                            onChange={(e) => setExtractOptions({
                                                ...extractOptions,
                                                extractText: e.target.checked
                                            })}
                                        />
                                        Extract Text Content
                                    </label>
                                )}

                                {childType === 'link' && (
                                    <label className="crx-ext-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={extractOptions.extractHref}
                                            onChange={(e) => setExtractOptions({
                                                ...extractOptions,
                                                extractHref: e.target.checked
                                            })}
                                        />
                                        Extract href Attribute
                                    </label>
                                )}

                                {childType === 'image' && (
                                    <>
                                        <label className="crx-ext-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={extractOptions.extractSrc}
                                                onChange={(e) => setExtractOptions({
                                                    ...extractOptions,
                                                    extractSrc: e.target.checked
                                                })}
                                            />
                                            Extract src Attribute
                                        </label>
                                        <label className="crx-ext-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={extractOptions.extractAlt}
                                                onChange={(e) => setExtractOptions({
                                                    ...extractOptions,
                                                    extractAlt: e.target.checked
                                                })}
                                            />
                                            Extract alt Attribute
                                        </label>
                                    </>
                                )}
                            </div>

                            <div className="crx-ext-form-actions">
                                <button
                                    className="crx-ext-btn crx-ext-btn-primary"
                                    disabled={picking}
                                    onClick={handleStartPicking}
                                >
                                    {picking ? "Picking..." : "Pick Child Element"}
                                </button>
                                <button
                                    className="crx-ext-btn crx-ext-btn-primary"
                                    onClick={handleAddChild}
                                    disabled={!selectedChild || !childName.trim()}
                                >
                                    Add Child
                                </button>
                                {selectedChild && (
                                    <button
                                        className="crx-ext-btn crx-ext-btn-secondary"
                                        onClick={resetForm}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Children List */}
                    {childElements.length > 0 && (
                        <div className="crx-ext-children-list">
                            <div className=""
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <h3>Selected Child Elements ({childElements.length})</h3>
                                <div onClick={exportRootChildrienData}>
                                    <BiDownload size={20} />
                                </div>
                            </div>
                            <div className="crx-ext-list-container">
                                {childElements.map((child) => (
                                    <div key={child.id} className="crx-ext-child-item">
                                        <div className="crx-ext-child-header">
                                            <div className="crx-ext-child-info">
                                                <span className="crx-ext-child-name">{child.name}</span>
                                                <span className="crx-ext-child-type">{child.type}</span>
                                                {child.isList && <span className="crx-ext-child-list-badge">List</span>}
                                            </div>
                                            <button
                                                className="crx-ext-btn crx-ext-btn-delete"
                                                onClick={() => removeChildElement(child.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="crx-ext-child-path">
                                            <code>{child.path}</code>
                                        </div>
                                        {(child.extractText || child.extractHref || child.extractSrc || child.extractAlt) && (
                                            <div className="crx-ext-child-extracts">
                                                {child.extractText && <span className="crx-ext-extract-badge">Text</span>}
                                                {child.extractHref && <span className="crx-ext-extract-badge">Href</span>}
                                                {child.extractSrc && <span className="crx-ext-extract-badge">Src</span>}
                                                {child.extractAlt && <span className="crx-ext-extract-badge">Alt</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// All algorithms are now in: src/content/views/algorithms/childElementAlgorithms.ts
