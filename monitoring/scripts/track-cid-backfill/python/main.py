import os
import pandas as pd

csv_path = os.path.abspath(os.path.join(os.getcwd(), "..", "local-csv"))
# csv_path = os.path.abspath(os.path.join(os.getcwd(), '..', 'production-csv'))


def get_all_csvs():
    # Get the list of all files and directories
    dir_list = os.listdir(csv_path)
    print("Num files and directories in", csv_path, "is", len(dir_list))
    return dir_list


def generate_aggregate_csv():
    csvs = get_all_csvs()
    # print(csvs)
    dfs = [pd.read_csv("../local-csv/" + csv) for csv in csvs]
    # dfs = [pd.read_csv('../production-csv/' + csv) for csv in csvs]
    # print(dfs)
    final_result = pd.concat(dfs)
    final_result = final_result.groupby(final_result.track_id).first()
    # print(final_result)
    print(final_result.size)

    try:
        final_result.pop("Unnamed: 0")
    except:
        pass

    try:
        final_result.pop("Unnamed: 0.1")
    except:
        pass

    try:
        final_result.pop("Unnamed: 0.2")
    except:
        pass

    final_result = final_result.sort_values(by=["track_id"])
    final_result.to_csv("../track_cids.csv")
    # print(final_result)


def get_missing_track_cids_csv():
    final_result_read = pd.read_csv("../track_cids.csv")
    # print(final_result_read)

    all_track_ids_read = pd.read_csv("../all_track_ids.csv").sort_values(by=["TrackId"])
    # print(all_track_ids_read)

    # print(final_result_read[['TrackId']].compare(all_track_ids_read[['TrackId']]))
    # print(final_result_read['TrackId'].isnotin(all_track_ids_read['TrackId']).value_counts())

    the_missing = all_track_ids_read[
        ~all_track_ids_read["TrackId"].isin(final_result_read["track_id"])
    ].sort_values(by=["TrackId"])
    the_missing.to_csv("../missing_cids.csv", index=False, header=False)


def main():
    generate_aggregate_csv()
    get_missing_track_cids_csv()


if __name__ == "__main__":
    main()
