import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";

import {
  Panel,
  PanelHeader,
  Dropdown,
  Stack,
  Button,
  Input,
  Icon,
  IconButton,
  Text,
  Toggle,
  OverlayList,
} from "pavelLaptev/react-figma-ui/ui";

import { pushToJSONBin } from "./../../../utils/servers/pushToJSONBin";
import { pushToGithub } from "./../../../utils/servers/pushToGithub";
import { pushToCustomURL } from "./../../../utils/servers/pushToCustomURL";

import { countTokens } from "./../../../utils/countTokens";

type StyleListItemType = {
  id: stylesType;
  label: string;
  icon: JSX.Element;
};

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI;
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  isCodePreviewOpen: boolean;
  setIsCodePreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const stylesList = [
  {
    id: "text",
    label: "Typography",
    icon: <Icon name="text" size="32" />,
  },
  {
    id: "grids",
    label: "Grids",
    icon: <Icon name="grid-styles" size="32" />,
  },
  {
    id: "effects",
    label: "Effects",
    icon: <Icon name="effects" size="32" />,
  },
] as StyleListItemType[];

const serverList = [
  {
    id: "jsonbin",
    label: "JSONBin",
    iconName: "jsonbin",
  },
  {
    id: "github",
    label: "Github",
    iconName: "github",
  },
  {
    id: "customURL",
    label: "Custom URL",
    iconName: "custom-url-server",
  },
];

export const MainView = (props: ViewProps) => {
  const {
    JSONsettingsConfig,
    setJSONsettingsConfig,
    isCodePreviewOpen,
    setIsCodePreviewOpen,
  } = props;
  const [showServersOverlayList, setShowServersOverlayList] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState({} as any);

  const serversHeaderRef = React.useRef(null);

  //////////////////////
  // HANDLE FUNCTIONS //
  //////////////////////

  const handleIncludeScopesChange = (checked: boolean) => {
    // console.log("handleIncludeScopesChange", checked);

    setJSONsettingsConfig({
      ...JSONsettingsConfig,
      includeScopes: checked,
    });
  };

  const handleDTCGKeys = (checked: boolean) => {
    // console.log("handleSplitFilesChange", checked);

    setJSONsettingsConfig({
      ...JSONsettingsConfig,
      useDTCGKeys: checked,
    });
  };

  const handleShowOutput = () => {
    setIsCodePreviewOpen(!isCodePreviewOpen);
    getTokensPreview();
  };

  const handleShowServersOverlayList = () => {
    setShowServersOverlayList(!showServersOverlayList);
  };

  const handleServerView = (serverId: string) => {
    props.setCurrentView(serverId);
  };

  const getTokensPreview = () => {
    // send command to figma controller
    parent.postMessage(
      {
        pluginMessage: {
          type: "getTokens",
          role: "preview",
        } as TokensMessageI,
      },
      "*"
    );
  };

  const getTokensForPush = () => {
    const allEnebledServers = Object.keys(JSONsettingsConfig.servers).filter(
      (serverId) => JSONsettingsConfig.servers[serverId].isEnabled
    );

    // send command to figma controller
    parent.postMessage(
      {
        pluginMessage: {
          type: "getTokens",
          role: "push",
          server: allEnebledServers,
        } as TokensMessageI,
      },
      "*"
    );
  };

  /////////////////
  // USE EFFECTS //
  /////////////////

  // Recieve tokens from figma controller
  useEffect(() => {
    window.onmessage = (event) => {
      const { type, tokens, role, server } = event.data
        .pluginMessage as TokensMessageI;

      if (type === "setTokens") {
        if (role === "preview") {
          console.log("tokens preview", tokens);
          setGeneratedTokens(tokens);
        }

        if (role === "push") {
          if (server.includes("jsonbin")) {
            console.log("push to jsonbin");
            pushToJSONBin(JSONsettingsConfig.servers.jsonbin, tokens);
          }

          if (server.includes("github")) {
            console.log("push to github");
            pushToGithub(JSONsettingsConfig.servers.github, tokens);
          }

          if (server.includes("customURL")) {
            console.log("push to customURL");
            pushToCustomURL(JSONsettingsConfig.servers.customURL, tokens);
          }
        }
      }
    };
  }, []);

  //////////////////////
  // RENDER VARIABLES //
  //////////////////////

  const isAnyServerEnabled = Object.keys(JSONsettingsConfig.servers).some(
    (serverId) => JSONsettingsConfig.servers[serverId].isEnabled
  );
  const dynamicServerList = serverList.filter((server) => {
    if (!JSONsettingsConfig.servers[server.id].isEnabled) {
      return server;
    }
  });

  const getTokensStat = () => {
    // get lines count
    const codeLines = JSON.stringify(generatedTokens, null, 2).split(
      "\n"
    ).length;

    // get groups count
    const groupsCount = Object.keys(generatedTokens).reduce((acc, key) => {
      const group = generatedTokens[key];
      const groupKeys = Object.keys(group);

      return acc + groupKeys.length;
    }, 0);

    const tokensCount = countTokens(generatedTokens);

    // count size in bytes
    const size = new TextEncoder().encode(
      JSON.stringify(generatedTokens)
    ).length;

    return {
      codeLines,
      groupsCount,
      tokensCount,
      size,
    };
  };

  const tokensStat = getTokensStat();

  /////////////////
  // MAIN RENDER //
  /////////////////

  return (
    <div
      className={`${styles.container} ${
        isCodePreviewOpen ? styles.codePreviewOpen : ""
      }`}
    >
      <Stack className={styles.settingView} hasLeftRightPadding={false}>
        <Panel>
          <PanelHeader
            title="Show output"
            onClick={handleShowOutput}
            iconButtons={[
              {
                children: <Icon name="sidebar" size="32" />,
                onClick: handleShowOutput,
              },
            ]}
          />
        </Panel>

        <Panel>
          <Stack hasLeftRightPadding>
            <Dropdown
              label="Color mode"
              value={JSONsettingsConfig.colorMode}
              onChange={(value: colorModeType) => {
                setJSONsettingsConfig({
                  ...JSONsettingsConfig,
                  colorMode: value,
                });
              }}
              optionsSections={[
                {
                  options: [
                    {
                      id: "hex",
                      label: "HEX",
                    },
                  ],
                },
                {
                  options: [
                    {
                      id: "rgba-css",
                      label: "RGB CSS",
                    },
                    {
                      id: "rgba-object",
                      label: "RGBA Object",
                    },
                  ],
                },
                {
                  options: [
                    {
                      id: "hsla-css",
                      label: "HSL CSS",
                    },
                    {
                      id: "hsla-object",
                      label: "HSL Object",
                    },
                  ],
                },
              ]}
            />
          </Stack>
        </Panel>

        <Panel>
          <PanelHeader title="Include styles" isActive />

          <Stack hasLeftRightPadding={false} hasTopBottomPadding gap={2}>
            {stylesList.map((item, index) => {
              const configStylesList = JSONsettingsConfig.includeStyles;
              const styleItem = configStylesList[item.id];
              const isIncluded = styleItem.isIncluded;

              return (
                <Stack
                  key={index}
                  direction="row"
                  gap="var(--space-extra-small)"
                >
                  <Input
                    className={styles.styleNameInput}
                    id={`style-${item.id}`}
                    hasOutline={false}
                    value={styleItem.customName}
                    leftIcon={item.icon}
                    // onBlur={() => {
                    //   getTokensPreview();
                    // }}
                    onChange={(value: string) => {
                      setJSONsettingsConfig({
                        ...JSONsettingsConfig,
                        includeStyles: {
                          ...configStylesList,
                          [item.id]: {
                            ...styleItem,
                            customName: value,
                          },
                        },
                      });
                    }}
                  />
                  <Toggle
                    id={`toggle-${item.id}`}
                    checked={isIncluded}
                    onChange={(checked: boolean) => {
                      setJSONsettingsConfig({
                        ...JSONsettingsConfig,
                        includeStyles: {
                          ...configStylesList,
                          [item.id]: {
                            ...styleItem,
                            isIncluded: checked,
                          },
                        },
                      });
                    }}
                  />
                </Stack>
              );
            })}
          </Stack>
        </Panel>

        {Object.keys(JSONsettingsConfig.includeStyles).some((styleId) => {
          return JSONsettingsConfig.includeStyles[styleId].isIncluded;
        }) && (
          <Panel>
            <Stack hasLeftRightPadding>
              <Dropdown
                label="Add styles to"
                value={JSONsettingsConfig.selectedCollection}
                onChange={(value: string) => {
                  setJSONsettingsConfig({
                    ...JSONsettingsConfig,
                    selectedCollection: value,
                  });
                }}
                optionsSections={[
                  {
                    options: [
                      {
                        id: "none",
                        label: "Keep separate",
                      },
                    ],
                  },
                  {
                    options: JSONsettingsConfig.variableCollections.map(
                      (collection) => {
                        return {
                          id: collection,
                          label: collection,
                        };
                      }
                    ),
                  },
                ]}
              />
            </Stack>
          </Panel>
        )}

        <Panel>
          <Stack>
            <Toggle
              id="scope-feature"
              onChange={(checked: boolean) => {
                handleIncludeScopesChange(checked);
              }}
            >
              <Text>Include variable scopes</Text>
            </Toggle>
          </Stack>
        </Panel>

        <Panel>
          <Stack hasLeftRightPadding>
            <Toggle
              id="use-dtcg-key"
              checked={JSONsettingsConfig.useDTCGKeys}
              onChange={handleDTCGKeys}
            >
              <Text>Use DTCG keys format</Text>
            </Toggle>
          </Stack>
        </Panel>

        <Panel>
          <PanelHeader
            ref={serversHeaderRef}
            title="Connect server"
            onClick={handleShowServersOverlayList}
            iconButtons={[
              {
                children: (
                  <>
                    <Icon name="plus" size="32" />
                    {showServersOverlayList && (
                      <OverlayList
                        trigger={serversHeaderRef.current}
                        className={styles.overlayServerList}
                        onOutsideClick={handleShowServersOverlayList}
                        onClick={handleServerView}
                        optionsSections={[
                          {
                            options: dynamicServerList,
                          },
                        ]}
                      />
                    )}
                  </>
                ),
                onClick: handleShowServersOverlayList,
              },
            ]}
          />

          {isAnyServerEnabled && (
            <Stack
              hasLeftRightPadding
              hasTopBottomPadding
              gap="var(--space-small)"
            >
              <Stack hasLeftRightPadding={false} gap={4}>
                {Object.keys(JSONsettingsConfig.servers).map(
                  (serverId, index) => {
                    if (!JSONsettingsConfig.servers[serverId].isEnabled) {
                      return null;
                    }

                    const server = serverList.find(
                      (server) => server.id === serverId
                    ) as (typeof serverList)[0];

                    const handleNewView = () => {
                      props.setCurrentView(server.id);
                    };

                    return (
                      <Stack
                        className={styles.rowItem}
                        key={index}
                        hasLeftRightPadding={false}
                        direction="row"
                        onClick={handleNewView}
                        gap={1}
                      >
                        <Icon name={server.iconName} size="32" />
                        <Text className={styles.rowItemText}>
                          {server.label}
                        </Text>
                        <IconButton
                          onClick={handleNewView}
                          children={<Icon name="kebab" size="32" />}
                        />
                      </Stack>
                    );
                  }
                )}
              </Stack>

              <Stack>
                <Button
                  label="Push to server"
                  onClick={getTokensForPush}
                  fullWidth
                />
              </Stack>
            </Stack>
          )}
        </Panel>

        <Stack hasTopBottomPadding>
          <Stack hasLeftRightPadding hasTopBottomPadding>
            <Button
              label="Download JSON"
              onClick={getTokensPreview}
              fullWidth
              secondary
            />
          </Stack>
        </Stack>
      </Stack>

      {isCodePreviewOpen && (
        <section className={styles.codePreview}>
          <section className={styles.previewToolbar}>
            <button
              className={`${styles.toolbarItem} ${styles.previewToolbarButton}`}
              onClick={getTokensPreview}
            >
              <Icon name="refresh" size="16" />
              <Text>Update</Text>
            </button>

            <div
              className={`${styles.toolbarItem} ${styles.previewToolbarStat}`}
            >
              <Text>
                {tokensStat.tokensCount} tokens, {tokensStat.groupsCount}{" "}
                groups, {tokensStat.codeLines} lines
              </Text>
            </div>

            <div
              className={`${styles.toolbarItem} ${styles.previewToolbarStat}`}
            >
              <Text>{tokensStat.size / 1000} KB</Text>
            </div>
          </section>

          <pre>
            <code>{JSON.stringify(generatedTokens, null, 2)}</code>
          </pre>
        </section>
      )}
    </div>
  );
};
